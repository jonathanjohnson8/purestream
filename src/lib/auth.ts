import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  roles: AppRole[];
}

/** Returns the authenticated user + their roles, or null. Use in Server Components. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id,email,name")
    .eq("id", user.id)
    .single();

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  return {
    id: user.id,
    email: profile?.email ?? user.email ?? "",
    name: profile?.name ?? null,
    roles: (roleRows ?? []).map((r: { role: AppRole }) => r.role),
  };
}

export function homeForRoles(roles: AppRole[]): string {
  if (roles.includes("admin") || roles.includes("support")) return "/admin";
  if (roles.includes("vendor_owner") || roles.includes("vendor_staff")) return "/vendor";
  if (roles.includes("shopper")) return "/shopper";
  return "/shop";
}
