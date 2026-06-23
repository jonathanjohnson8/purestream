"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { optimizeRoute, geocode, type LatLng } from "@/lib/maps";

export async function claimAdmin() {
  const supabase = await createClient();
  await supabase.rpc("claim_admin");
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Batch all vendor-confirmed, unassigned orders into one optimized multi-stop
 * route. Uses Google Directions when a key is set, else nearest-neighbor.
 */
export async function optimizeRoutes() {
  const supabase = await createClient();

  const { data: assignedAll } = await supabase.from("route_stops").select("order_id");
  const taken = new Set((assignedAll ?? []).map((s: any) => s.order_id));

  const { data: confirmed } = await supabase
    .from("orders")
    .select("id, delivery_address_id, vendor_location_id, vendor_locations(address_id)")
    .eq("status", "vendor_confirmed");
  const orders = (confirmed ?? []).filter((o: any) => !taken.has(o.id));
  if (orders.length === 0) return { error: "No confirmed orders to dispatch" };

  // Resolve coordinates for each order's dropoff.
  const dropoffs: { orderId: string; addressId: string; coord: LatLng }[] = [];
  for (const o of orders) {
    const { data: a } = await supabase
      .from("addresses")
      .select("latitude,longitude")
      .eq("id", o.delivery_address_id)
      .maybeSingle();
    const coord = a?.latitude ? { lat: a.latitude, lng: a.longitude } : await geocode("Austin, TX");
    dropoffs.push({ orderId: o.id, addressId: o.delivery_address_id, coord });
  }

  const depot = await geocode("Austin, TX 78701");
  const optimized = await optimizeRoute(
    depot,
    dropoffs.map((d) => d.coord),
    dropoffs[dropoffs.length - 1].coord
  );

  // pick first available shopper (if any)
  const { data: shopper } = await supabase
    .from("shoppers")
    .select("id")
    .eq("approval_status", "approved")
    .limit(1)
    .maybeSingle();

  const { data: route } = await supabase
    .from("routes")
    .insert({
      shopper_id: shopper?.id ?? null,
      status: shopper ? "assigned" : "planned",
      total_distance_miles: optimized.distanceMiles,
      encoded_polyline: optimized.polyline,
      optimization_provider: optimized.polyline ? "google_directions" : "nearest_neighbor",
    })
    .select("id")
    .single();
  if (!route) return { error: "Could not create route" };

  let seq = 1;
  const stops: any[] = [];
  for (const idx of optimized.order) {
    const d = dropoffs[idx];
    stops.push({ route_id: route.id, order_id: d.orderId, stop_type: "pickup", sequence_number: seq++, status: "pending" });
    stops.push({ route_id: route.id, order_id: d.orderId, stop_type: "dropoff", sequence_number: seq++, address_id: d.addressId, status: "pending" });
  }
  await supabase.from("route_stops").insert(stops);

  if (shopper) {
    await supabase.from("route_assignments").insert({ route_id: route.id, shopper_id: shopper.id, status: "accepted", responded_at: new Date().toISOString() });
    for (const o of orders) {
      await supabase.from("orders").update({ status: "shopper_assigned" }).eq("id", o.id);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/dispatch");
  return { ok: true, stops: stops.length, miles: optimized.distanceMiles, assigned: !!shopper };
}

export async function refundOrder(orderId: string) {
  const supabase = await createClient();
  const me = await getSessionUser();
  const { data: order } = await supabase.from("orders").select("total").eq("id", orderId).single();
  await supabase.from("orders").update({ status: "refunded", payment_status: "refunded" }).eq("id", orderId);
  await supabase.from("payments").update({ status: "refunded" }).eq("order_id", orderId);
  // reversing ledger entry
  await supabase.from("ledger_entries").insert({
    order_id: orderId,
    account_type: "customer",
    entry_type: "credit",
    amount: order?.total ?? 0,
    reference_type: "refund",
    memo: "Order refunded by admin",
  });
  await supabase.from("order_events").insert({ order_id: orderId, event_type: "refunded", to_status: "refunded", actor_user_id: me?.id });
  revalidatePath("/admin/orders");
  revalidatePath(`/orders/${orderId}`);
  return { ok: true };
}
