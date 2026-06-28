"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";

const ACTIVE_VENDOR_COOKIE = "ps_active_vendor";

/** Link the current user to a vendor (POC) and make it the active one. */
export async function activateVendor(vendorId: string) {
  const supabase = await createClient();
  const me = await getSessionUser();
  if (!me) return { error: "Not signed in" };

  const { data: existing } = await supabase
    .from("vendor_users")
    .select("id")
    .eq("user_id", me.id)
    .eq("vendor_id", vendorId)
    .maybeSingle();

  if (!existing) {
    await supabase.from("vendor_users").insert({ vendor_id: vendorId, user_id: me.id, role: "vendor_owner" });
    await supabase.from("user_roles").insert({ user_id: me.id, role: "vendor_owner", scope_type: "vendor", scope_id: vendorId });
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_VENDOR_COOKIE, vendorId, { path: "/", maxAge: 60 * 60 * 24 * 30 });

  revalidatePath("/vendor");
  revalidatePath("/vendor/products");
  revalidatePath("/vendor/orders");
  return { ok: true };
}

/** Switch which managed vendor is active (must already be linked). */
export async function switchVendor(vendorId: string) {
  const me = await getSessionUser();
  if (!me) return { error: "Not signed in" };
  const supabase = await createClient();
  const { data: link } = await supabase
    .from("vendor_users")
    .select("id")
    .eq("user_id", me.id)
    .eq("vendor_id", vendorId)
    .maybeSingle();
  if (!link) return { error: "You don't manage that vendor yet" };

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_VENDOR_COOKIE, vendorId, { path: "/", maxAge: 60 * 60 * 24 * 30 });

  revalidatePath("/vendor");
  revalidatePath("/vendor/products");
  revalidatePath("/vendor/orders");
  return { ok: true };
}

export async function setAvailability(productId: string, status: "available" | "unavailable") {
  const supabase = await createClient();
  await supabase.from("product_availability").update({ availability_status: status }).eq("product_id", productId);
  revalidatePath("/vendor/products");
  return { ok: true };
}

export async function updatePrice(productId: string, price: number) {
  const supabase = await createClient();
  await supabase.from("products").update({ price }).eq("id", productId);
  revalidatePath("/vendor/products");
  return { ok: true };
}
