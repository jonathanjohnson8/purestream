import { ShieldCheck, DollarSign, ShoppingBag, Store, Truck, Activity, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { ClaimAdmin } from "@/components/admin/AdminButtons";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { signOut } from "@/app/login/actions";
import { money } from "@/lib/format";

function SignOutButton() {
  return (
    <form action={signOut}>
      <button className="btn w-full bg-white border border-gray-200 text-ink-700 py-3">
        <LogOut size={18} /> Sign out
      </button>
    </form>
  );
}

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const me = await getSessionUser();
  const isAdmin = me?.roles.includes("admin") || me?.roles.includes("support");

  if (!isAdmin) {
    return (
      <main className="px-5 pt-12 pb-28">
        <h1 className="text-2xl font-bold text-ink-900 mb-2">Admin / Ops</h1>
        <p className="text-ink-500 mb-6">Enable admin access to view platform operations.</p>
        <div className="card p-6 text-center">
          <span className="grid place-items-center w-16 h-16 rounded-full bg-brand-50 text-brand-600 mx-auto mb-3">
            <ShieldCheck size={30} />
          </span>
          <ClaimAdmin />
        </div>
        <WorkspaceSwitcher current="/admin" />
        <SignOutButton />
      </main>
    );
  }

  const supabase = await createClient();
  const [{ data: orders }, { count: vendorCount }, { count: shopperCount }, { data: events }] = await Promise.all([
    supabase.from("orders").select("status,total,subtotal"),
    supabase.from("vendors").select("id", { count: "exact", head: true }),
    supabase.from("shoppers").select("id", { count: "exact", head: true }),
    supabase.from("order_events").select("event_type,created_at,order_id").order("created_at", { ascending: false }).limit(8),
  ]);

  const gmv = (orders ?? []).filter((o: any) => !["canceled", "refunded"].includes(o.status)).reduce((s: number, o: any) => s + Number(o.total), 0);
  const serviceRev = (orders ?? []).reduce((s: number, o: any) => s + Number(o.subtotal) * 0.08, 0);

  return (
    <main className="px-5 pt-12 pb-28 space-y-5">
      <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
        <ShieldCheck size={22} className="text-brand-600" /> Operations
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Metric icon={DollarSign} label="GMV" value={money(gmv)} />
        <Metric icon={DollarSign} label="Service revenue" value={money(serviceRev)} tone="brand" />
        <Metric icon={ShoppingBag} label="Orders" value={String((orders ?? []).length)} />
        <Metric icon={Store} label="Vendors" value={String(vendorCount ?? 0)} />
        <Metric icon={Truck} label="Shoppers" value={String(shopperCount ?? 0)} />
        <Metric icon={Activity} label="Active" value={String((orders ?? []).filter((o: any) => ["shopping","picked_up","out_for_delivery","shopper_assigned"].includes(o.status)).length)} />
      </div>

      <section className="card p-4">
        <h2 className="font-semibold text-ink-900 mb-3 flex items-center gap-2">
          <Activity size={18} className="text-brand-600" /> Recent activity
        </h2>
        <ul className="space-y-2">
          {(events ?? []).map((e: any, i: number) => (
            <li key={i} className="flex justify-between text-sm">
              <span className="text-ink-700 capitalize">{e.event_type.replaceAll("_", " ")}</span>
              <span className="text-ink-400 text-xs">{new Date(e.created_at).toLocaleTimeString()}</span>
            </li>
          ))}
          {(events ?? []).length === 0 && <li className="text-sm text-ink-400">No activity yet.</li>}
        </ul>
      </section>

      <WorkspaceSwitcher current="/admin" />
      <SignOutButton />
    </main>
  );
}

function Metric({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone?: "brand" }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-ink-500 flex items-center gap-1"><Icon size={13} /> {label}</p>
      <p className={`text-xl font-bold ${tone === "brand" ? "text-brand-700" : "text-ink-900"}`}>{value}</p>
    </div>
  );
}
