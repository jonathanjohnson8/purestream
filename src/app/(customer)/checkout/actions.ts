"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { computePricing, vendorPayout, type PricingLine } from "@/lib/pricing";
import { geocode } from "@/lib/maps";

interface CheckoutLine {
  productId: string;
  qty: number;
}

export async function placeOrder(_prev: unknown, formData: FormData) {
  const user = await getSessionUser();
  if (!user) return { error: "Not signed in" };

  const supabase = await createClient();
  const lines: CheckoutLine[] = JSON.parse(String(formData.get("lines") || "[]"));
  if (lines.length === 0) return { error: "Your cart is empty" };

  const vendorId = String(formData.get("vendorId"));
  const isOnDemand = String(formData.get("schedule")) === "now";
  const windowStart = isOnDemand ? null : String(formData.get("windowStart") || "") || null;
  const promoCode = String(formData.get("promoCode") || "").trim().toUpperCase();
  const street = String(formData.get("street") || "").trim();
  const city = String(formData.get("city") || "Austin").trim();
  const postal = String(formData.get("postal") || "").trim();
  const instructions = String(formData.get("instructions") || "").trim();

  if (!street) return { error: "Please enter a delivery address" };

  // ---- Resolve products (trust DB prices, not client) ----
  const { data: products } = await supabase
    .from("products")
    .select("id,name,price,deposit_amount,weight_lbs,vendor_id")
    .in("id", lines.map((l) => l.productId));

  if (!products || products.length === 0) return { error: "Products not found" };

  const priceLines: PricingLine[] = [];
  const weightTotal = lines.reduce((s, l) => {
    const p = products.find((x: any) => x.id === l.productId);
    return s + (p ? Number(p.weight_lbs) * l.qty : 0);
  }, 0);

  for (const l of lines) {
    const p = products.find((x: any) => x.id === l.productId);
    if (!p) continue;
    priceLines.push({
      unit_price: Number(p.price),
      quantity: l.qty,
      deposit_amount: Number(p.deposit_amount),
    });
  }

  // ---- Delivery fee from vendor zone ----
  const { data: zone } = await supabase
    .from("delivery_zones")
    .select("flat_delivery_fee")
    .eq("owner_type", "vendor")
    .eq("owner_id", vendorId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  const flatDeliveryFee = zone ? Number(zone.flat_delivery_fee) : 9.99;

  // ---- Promo ----
  let promo = null as { id: string; promo_type: any; value: number } | null;
  if (promoCode) {
    const { data: pr } = await supabase
      .from("promotions")
      .select("id,promo_type,value,min_subtotal,is_active")
      .eq("code", promoCode)
      .eq("is_active", true)
      .maybeSingle();
    if (pr) {
      const sub = priceLines.reduce((s, l) => s + l.unit_price * l.quantity, 0);
      if (sub >= Number(pr.min_subtotal ?? 0)) {
        promo = { id: pr.id, promo_type: pr.promo_type, value: Number(pr.value) };
      }
    }
  }

  const pricing = computePricing({
    lines: priceLines,
    flatDeliveryFee,
    promo: promo ? { promo_type: promo.promo_type, value: promo.value } : null,
  });

  // ---- Geocode address (Google if key set; else approx Austin) ----
  const coords = await geocode(`${street}, ${city}, TX ${postal}`);

  const { data: address, error: addrErr } = await supabase
    .from("addresses")
    .insert({
      owner_type: "user",
      owner_id: user.id,
      label: "Delivery",
      street,
      city,
      state: "TX",
      postal_code: postal,
      latitude: coords.lat,
      longitude: coords.lng,
      delivery_instructions: instructions || null,
    })
    .select("id")
    .single();
  if (addrErr) return { error: addrErr.message };

  // pick a vendor_location for fulfillment
  const { data: loc } = await supabase
    .from("vendor_locations")
    .select("id")
    .eq("vendor_id", vendorId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  // ---- Create order ----
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      customer_user_id: user.id,
      vendor_id: vendorId,
      vendor_location_id: loc?.id ?? null,
      delivery_address_id: address.id,
      fulfillment_type: "platform_shopper",
      status: "vendor_pending",
      is_on_demand: isOnDemand,
      scheduled_window_start: windowStart,
      subtotal: pricing.subtotal,
      delivery_fee: pricing.delivery_fee,
      service_fee: pricing.service_fee,
      deposit_total: pricing.deposit_total,
      discount_total: pricing.discount_total,
      tax_total: pricing.tax_total,
      credits_applied: pricing.credits_applied,
      total: pricing.total,
      payment_status: "authorized",
      promo_id: promo?.id ?? null,
      notes: instructions || null,
    })
    .select("id,order_number")
    .single();
  if (orderErr) return { error: orderErr.message };

  // ---- Order items ----
  const itemRows = lines
    .map((l) => {
      const p = products.find((x: any) => x.id === l.productId);
      if (!p) return null;
      return {
        order_id: order.id,
        product_id: p.id,
        product_name_snapshot: p.name,
        quantity: l.qty,
        unit_price: Number(p.price),
        deposit_amount: Number(p.deposit_amount),
        weight_lbs: Number(p.weight_lbs),
        status: "pending",
      };
    })
    .filter(Boolean);
  await supabase.from("order_items").insert(itemRows as any);

  // ---- Mock payment authorization ----
  await supabase.from("payments").insert({
    order_id: order.id,
    provider: "stripe_mock",
    provider_payment_intent_id: `pi_mock_${order.id.slice(0, 8)}`,
    amount_authorized: pricing.total,
    amount_captured: 0,
    status: "authorized",
  });

  // ---- Ledger entries (immutable) ----
  const { commission } = vendorPayout(pricing.subtotal, 0.15);
  await supabase.from("ledger_entries").insert([
    { order_id: order.id, account_type: "customer", account_id: user.id, entry_type: "debit", amount: pricing.total, reference_type: "order_total", memo: "Customer charge (authorized)" },
    { order_id: order.id, account_type: "platform", entry_type: "credit", amount: pricing.service_fee, reference_type: "service_fee", memo: "Platform service fee" },
    { order_id: order.id, account_type: "vendor", account_id: vendorId, entry_type: "credit", amount: pricing.subtotal, reference_type: "vendor_sale", memo: "Vendor product sale" },
    { order_id: order.id, account_type: "platform", account_id: vendorId, entry_type: "credit", amount: commission, reference_type: "vendor_commission", memo: "Vendor commission" },
  ]);

  // ---- Bottle deposits ----
  if (pricing.deposit_total > 0) {
    const bottleCount = lines.reduce((s, l) => {
      const p = products.find((x: any) => x.id === l.productId);
      return s + (p && Number(p.deposit_amount) > 0 ? l.qty : 0);
    }, 0);
    await supabase.from("bottle_transactions").insert({
      order_id: order.id,
      customer_user_id: user.id,
      transaction_type: "deposit_charged",
      bottle_count: bottleCount,
      amount: pricing.deposit_total,
      status: "completed",
      recorded_by_user_id: user.id,
    });
  }

  // ---- Chat thread + status event ----
  await supabase.from("chat_threads").insert({ order_id: order.id, status: "open" });
  await supabase.from("order_events").insert({
    order_id: order.id,
    event_type: "order_placed",
    to_status: "vendor_pending",
    actor_user_id: user.id,
    metadata: { weight_lbs: weightTotal },
  });

  redirect(`/orders/${order.id}?placed=1`);
}
