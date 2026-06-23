import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";

/** Resolve the vendor the current user manages (first linked vendor). */
export async function getCurrentVendor() {
  const supabase = await createClient();
  const me = await getSessionUser();
  if (!me) return null;
  const { data: vu } = await supabase
    .from("vendor_users")
    .select("vendor_id, vendors(id,name,description,commission_rate)")
    .eq("user_id", me.id)
    .maybeSingle();
  return (vu as any)?.vendors ?? null;
}
