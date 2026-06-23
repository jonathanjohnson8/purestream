"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";

/** Ensure the current user has a shopper profile (approved for the POC). */
export async function activateShopper() {
  const supabase = await createClient();
  const me = await getSessionUser();
  if (!me) return { error: "Not signed in" };

  const { data: existing } = await supabase.from("shoppers").select("id").eq("user_id", me.id).maybeSingle();
  if (!existing) {
    await supabase.from("shoppers").insert({
      user_id: me.id,
      approval_status: "approved",
      vehicle_type: "Cargo van",
      vehicle_capacity_lbs: 1500,
      status: "available",
      current_lat: 30.2672,
      current_lng: -97.7431,
    });
    await supabase.from("user_roles").insert({ user_id: me.id, role: "shopper" }).select();
  }
  revalidatePath("/shopper");
  return { ok: true };
}

/** Accept an unassigned, vendor-confirmed order: build a 2-stop route and assign self. */
export async function acceptJob(orderId: string) {
  const supabase = await createClient();
  const me = await getSessionUser();
  if (!me) return { error: "Not signed in" };

  const { data: shopper } = await supabase.from("shoppers").select("id").eq("user_id", me.id).maybeSingle();
  if (!shopper) return { error: "Activate your shopper account first" };

  const { data: order } = await supabase
    .from("orders")
    .select("id, vendor_location_id, delivery_address_id, vendor_locations(address_id)")
    .eq("id", orderId)
    .single();
  if (!order) return { error: "Order not found" };

  const { data: route } = await supabase
    .from("routes")
    .insert({ shopper_id: shopper.id, status: "assigned", optimization_provider: "google_maps" })
    .select("id")
    .single();
  if (!route) return { error: "Could not create route" };

  const pickupAddr = (order as any).vendor_locations?.address_id ?? null;
  await supabase.from("route_stops").insert([
    { route_id: route.id, order_id: orderId, stop_type: "pickup", sequence_number: 1, address_id: pickupAddr, status: "pending" },
    { route_id: route.id, order_id: orderId, stop_type: "dropoff", sequence_number: 2, address_id: order.delivery_address_id, status: "pending" },
  ]);
  await supabase.from("route_assignments").insert({ route_id: route.id, shopper_id: shopper.id, status: "accepted", responded_at: new Date().toISOString() });
  await supabase.from("orders").update({ status: "shopper_assigned" }).eq("id", orderId);
  await supabase.from("order_events").insert({ order_id: orderId, event_type: "shopper_assigned", to_status: "shopper_assigned", actor_user_id: me.id });

  revalidatePath("/shopper");
  revalidatePath(`/shopper/orders/${orderId}`);
  return { ok: true };
}

/** Push a simulated GPS location for live tracking. */
export async function pushLocation(lat: number, lng: number) {
  const supabase = await createClient();
  const me = await getSessionUser();
  if (!me) return { error: "Not signed in" };
  await supabase
    .from("shoppers")
    .update({ current_lat: lat, current_lng: lng, location_updated_at: new Date().toISOString() })
    .eq("user_id", me.id);
  return { ok: true };
}
