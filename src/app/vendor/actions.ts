"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";

const DEMO_VENDOR = "a0000000-0000-0000-0000-000000000001"; // AquaPure Springs

/** Link the current user to a demo vendor so they can manage it (POC). */
export async function activateVendor() {
  const supabase = await createClient();
  const me = await getSessionUser();
  if (!me) return { error: "Not signed in" };
  const { data: existing } = await supabase.from("vendor_users").select("id").eq("user_id", me.id).maybeSingle();
  if (!existing) {
    await supabase.from("vendor_users").insert({ vendor_id: DEMO_VENDOR, user_id: me.id, role: "vendor_owner" });
    await supabase.from("user_roles").insert({ user_id: me.id, role: "vendor_owner", scope_type: "vendor", scope_id: DEMO_VENDOR });
  }
  revalidatePath("/vendor");
  return { ok: true };
}

export async function setAvailability(productId: string, status: "available" | "unavailable") {
  const supabase = await createClient();
  await supabase
    .from("product_availability")
    .update({ availability_status: status })
    .eq("product_id", productId);
  revalidatePath("/vendor/products");
  return { ok: true };
}

export async function updatePrice(productId: string, price: number) {
  const supabase = await createClient();
  await supabase.from("products").update({ price }).eq("id", productId);
  revalidatePath("/vendor/products");
  return { ok: true };
}
