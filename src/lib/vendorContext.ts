import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";

const ACTIVE_VENDOR_COOKIE = "ps_active_vendor";

export interface ManagedVendor {
  id: string;
  name: string;
  description: string | null;
  commission_rate: number;
}

/** All vendors the current user is linked to manage. */
export async function getManagedVendors(): Promise<ManagedVendor[]> {
  const supabase = await createClient();
  const me = await getSessionUser();
  if (!me) return [];
  const { data } = await supabase
    .from("vendor_users")
    .select("vendor_id, vendors(id,name,description,commission_rate)")
    .eq("user_id", me.id);
  return (data ?? [])
    .map((r: { vendors: ManagedVendor | null }) => r.vendors)
    .filter((v): v is ManagedVendor => Boolean(v));
}

/** The active vendor = the one selected in the cookie, else the first managed one. */
export async function getCurrentVendor(): Promise<ManagedVendor | null> {
  const managed = await getManagedVendors();
  if (managed.length === 0) return null;
  const cookieStore = await cookies();
  const selected = cookieStore.get(ACTIVE_VENDOR_COOKIE)?.value;
  return managed.find((v) => v.id === selected) ?? managed[0];
}
