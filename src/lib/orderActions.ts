"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import type { OrderStatus } from "@/lib/types";

async function logEvent(
  orderId: string,
  eventType: string,
  toStatus: OrderStatus | null,
  meta?: Record<string, unknown>
) {
  const supabase = await createClient();
  const user = await getSessionUser();
  await supabase.from("order_events").insert({
    order_id: orderId,
    event_type: eventType,
    to_status: toStatus,
    actor_user_id: user?.id ?? null,
    metadata: meta ?? null,
  });
}

async function setStatus(orderId: string, status: OrderStatus, eventType: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (error) return { error: error.message };
  await logEvent(orderId, eventType, status);
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  revalidatePath("/vendor/orders");
  revalidatePath("/shopper");
  revalidatePath("/admin");
  return { ok: true };
}

// ---- Vendor ----
export async function vendorConfirm(orderId: string) {
  return setStatus(orderId, "vendor_confirmed", "vendor_confirmed");
}
export async function vendorReject(orderId: string) {
  const supabase = await createClient();
  await supabase.from("orders").update({ status: "canceled", payment_status: "refunded" }).eq("id", orderId);
  await logEvent(orderId, "vendor_rejected", "canceled");
  revalidatePath(`/orders/${orderId}`);
  return { ok: true };
}

// ---- Shopper lifecycle ----
export async function startShopping(orderId: string) {
  return setStatus(orderId, "shopping", "start_shopping");
}
export async function markPickedUp(orderId: string) {
  return setStatus(orderId, "picked_up", "picked_up");
}
export async function markOutForDelivery(orderId: string) {
  return setStatus(orderId, "out_for_delivery", "out_for_delivery");
}

export async function reportUnavailable(orderId: string, orderItemId: string) {
  const supabase = await createClient();
  await supabase.from("order_items").update({ status: "unavailable" }).eq("id", orderItemId);
  await logEvent(orderId, "item_unavailable", null, { orderItemId });
  revalidatePath(`/shopper/orders/${orderId}`);
  return { ok: true };
}

export async function suggestSubstitution(formData: FormData) {
  const supabase = await createClient();
  const user = await getSessionUser();
  const orderId = String(formData.get("orderId"));
  const orderItemId = String(formData.get("orderItemId"));
  const suggestedName = String(formData.get("suggestedName"));
  const suggestedPrice = Number(formData.get("suggestedPrice"));
  const suggestedQty = Number(formData.get("suggestedQty") || 1);

  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await supabase.from("substitutions").insert({
    order_id: orderId,
    original_order_item_id: orderItemId,
    suggested_name_snapshot: suggestedName,
    suggested_price: suggestedPrice,
    suggested_quantity: suggestedQty,
    suggested_by_user_id: user?.id ?? null,
    customer_decision: "pending",
    expires_at: expires,
    status: "pending",
  });
  await supabase.from("orders").update({ status: "substitution_pending" }).eq("id", orderId);
  await logEvent(orderId, "substitution_suggested", "substitution_pending", { orderItemId });
  revalidatePath(`/shopper/orders/${orderId}`);
  revalidatePath(`/orders/${orderId}`);
  return { ok: true };
}

// ---- Customer substitution decisions ----
export async function decideSubstitution(substitutionId: string, approve: boolean) {
  const supabase = await createClient();
  const { data: sub } = await supabase
    .from("substitutions")
    .select("id,order_id,original_order_item_id,suggested_name_snapshot,suggested_price,suggested_quantity")
    .eq("id", substitutionId)
    .single();
  if (!sub) return { error: "Substitution not found" };

  await supabase
    .from("substitutions")
    .update({ customer_decision: approve ? "approved" : "rejected", status: "resolved" })
    .eq("id", substitutionId);

  if (approve) {
    await supabase
      .from("order_items")
      .update({
        status: "substituted",
        product_name_snapshot: sub.suggested_name_snapshot,
        unit_price: sub.suggested_price,
        quantity: sub.suggested_quantity,
      })
      .eq("id", sub.original_order_item_id);
  } else {
    await supabase.from("order_items").update({ status: "refunded" }).eq("id", sub.original_order_item_id);
  }

  // Any remaining pending subs? If not, return to shopping.
  const { count } = await supabase
    .from("substitutions")
    .select("id", { count: "exact", head: true })
    .eq("order_id", sub.order_id)
    .eq("status", "pending");
  if (!count) {
    await supabase.from("orders").update({ status: "shopping" }).eq("id", sub.order_id);
  }
  await logEvent(sub.order_id, approve ? "substitution_approved" : "substitution_rejected", null);
  revalidatePath(`/orders/${sub.order_id}`);
  revalidatePath(`/shopper/orders/${sub.order_id}`);
  return { ok: true };
}

// ---- Chat ----
export async function sendChatMessage(orderId: string, body: string) {
  const supabase = await createClient();
  const user = await getSessionUser();
  const { data: thread } = await supabase
    .from("chat_threads")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();
  let threadId = thread?.id;
  if (!threadId) {
    const { data: t } = await supabase
      .from("chat_threads")
      .insert({ order_id: orderId, status: "open" })
      .select("id")
      .single();
    threadId = t?.id;
  }
  if (!threadId) return { error: "No chat thread" };
  await supabase.from("chat_messages").insert({
    thread_id: threadId,
    sender_user_id: user?.id ?? null,
    message_type: "text",
    body,
  });
  return { ok: true };
}

// ---- Proof of delivery (completes order + captures payment + posts payouts) ----
export async function completeDelivery(formData: FormData) {
  const supabase = await createClient();
  const user = await getSessionUser();
  const orderId = String(formData.get("orderId"));
  const signedBy = String(formData.get("signedBy") || "");
  const notes = String(formData.get("notes") || "");
  const lat = Number(formData.get("lat") || 0) || null;
  const lng = Number(formData.get("lng") || 0) || null;

  await supabase.from("delivery_proofs").insert({
    order_id: orderId,
    photo_url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600",
    signature_url: null,
    signed_by_name: signedBy || "Recipient",
    latitude: lat,
    longitude: lng,
    notes: notes || null,
  });

  const { data: order } = await supabase
    .from("orders")
    .select("id,total,subtotal,vendor_id")
    .eq("id", orderId)
    .single();

  await supabase
    .from("orders")
    .update({ status: "delivered", payment_status: "captured" })
    .eq("id", orderId);

  // Capture mock payment
  await supabase.from("payments").update({ amount_captured: order?.total ?? 0, status: "captured" }).eq("order_id", orderId);

  // Payout entries
  if (order) {
    const commission = Math.round(order.subtotal * 0.15 * 100) / 100;
    const vendorPayout = Math.round((order.subtotal - commission) * 100) / 100;
    await supabase.from("payouts").insert([
      { recipient_type: "vendor", recipient_id: order.vendor_id, order_id: orderId, amount: vendorPayout, status: "pending" },
    ]);
    const shopperId = await (async () => {
      const { data } = await supabase.from("shoppers").select("id").eq("user_id", user?.id ?? "").maybeSingle();
      return data?.id ?? null;
    })();
    if (shopperId) {
      await supabase.from("payouts").insert({ recipient_type: "shopper", recipient_id: shopperId, order_id: orderId, amount: 12.5, status: "pending" });
    }
    await supabase.from("ledger_entries").insert([
      { order_id: orderId, account_type: "customer", entry_type: "credit", amount: order.total, reference_type: "payment_capture", memo: "Payment captured" },
      { order_id: orderId, account_type: "vendor", account_id: order.vendor_id, entry_type: "debit", amount: vendorPayout, reference_type: "vendor_payout", memo: "Vendor payout scheduled" },
    ]);
  }

  await logEvent(orderId, "delivered_with_proof", "delivered", { signedBy });
  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/shopper`);
  return { ok: true };
}

export async function recordBottlePickup(orderId: string, count: number) {
  const supabase = await createClient();
  const user = await getSessionUser();
  const { data: order } = await supabase.from("orders").select("customer_user_id").eq("id", orderId).single();
  const creditPerBottle = 8.0;
  const amount = Math.round(count * creditPerBottle * 100) / 100;
  await supabase.from("bottle_transactions").insert([
    { order_id: orderId, customer_user_id: order?.customer_user_id, transaction_type: "empty_pickup_recorded", bottle_count: count, amount, status: "completed", recorded_by_user_id: user?.id },
    { order_id: orderId, customer_user_id: order?.customer_user_id, transaction_type: "credit_issued", bottle_count: count, amount, status: "completed", recorded_by_user_id: user?.id },
  ]);
  if (order?.customer_user_id) {
    await supabase.from("credits").insert({
      owner_type: "user",
      owner_id: order.customer_user_id,
      amount,
      reason: `Empty bottle pickup (${count})`,
      reference_type: "bottle_pickup",
      reference_id: orderId,
    });
  }
  await logEvent(orderId, "bottle_pickup_recorded", null, { count, amount });
  revalidatePath(`/shopper/orders/${orderId}`);
  return { ok: true };
}
