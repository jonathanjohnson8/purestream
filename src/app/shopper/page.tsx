import Link from "next/link";
import { Truck, MapPin, Package, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { ActivateShopper } from "@/components/shopper/ActivateShopper";
import { AcceptJobButton } from "@/components/shopper/AcceptJobButton";
import { money } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ShopperJobs() {
  const supabase = await createClient();
  const me = await getSessionUser();

  const { data: shopper } = await supabase
    .from("shoppers")
    .select("id,status,vehicle_type,vehicle_capacity_lbs")
    .eq("user_id", me?.id ?? "")
    .maybeSingle();

  if (!shopper) {
    return (
      <main className="px-5 pt-12 pb-28">
        <h1 className="text-2xl font-bold text-ink-900 mb-2">Shopper / Driver</h1>
        <p className="text-ink-500 mb-6">Activate your shopper account to start accepting delivery jobs.</p>
        <div className="card p-6 text-center">
          <span className="grid place-items-center w-16 h-16 rounded-full bg-brand-50 text-brand-600 mx-auto mb-3">
            <Truck size={30} />
          </span>
          <ActivateShopper />
        </div>
      </main>
    );
  }

  // Active jobs assigned to me
  const { data: myStops } = await supabase
    .from("route_stops")
    .select("order_id, routes!inner(shopper_id)")
    .eq("routes.shopper_id", shopper.id);
  const myOrderIds = Array.from(new Set((myStops ?? []).map((s: any) => s.order_id)));

  const { data: activeOrders } = myOrderIds.length
    ? await supabase
        .from("orders")
        .select("id,order_number,status,total,vendor_id,vendors(name)")
        .in("id", myOrderIds)
        .not("status", "in", "(delivered,completed,canceled,refunded)")
        .order("created_at", { ascending: false })
    : { data: [] };

  // Available jobs: vendor_confirmed with no route stop yet
  const { data: assignedAll } = await supabase.from("route_stops").select("order_id");
  const takenIds = new Set((assignedAll ?? []).map((s: any) => s.order_id));
  const { data: confirmed } = await supabase
    .from("orders")
    .select("id,order_number,status,total,vendor_id,vendors(name)")
    .eq("status", "vendor_confirmed")
    .order("created_at", { ascending: false });
  const available = (confirmed ?? []).filter((o: any) => !takenIds.has(o.id));

  return (
    <main className="px-5 pt-12 pb-28 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-ink-900">Jobs</h1>
        <p className="text-sm text-ink-500 flex items-center gap-1">
          <Truck size={14} /> {shopper.vehicle_type} · {shopper.vehicle_capacity_lbs} lb capacity
        </p>
      </header>

      <section>
        <h2 className="font-semibold text-ink-900 mb-3 flex items-center gap-2">
          <Package size={18} className="text-brand-600" /> Your active jobs
        </h2>
        {(!activeOrders || activeOrders.length === 0) && (
          <p className="text-sm text-ink-400">No active jobs. Accept one below.</p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {(activeOrders ?? []).map((o: any) => (
            <Link key={o.id} href={`/shopper/orders/${o.id}`} className="card block p-4 hover:shadow-float transition">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-ink-900">#{o.order_number} · {o.vendors?.name}</span>
                <StatusBadge status={o.status as OrderStatus} />
              </div>
              <p className="text-sm text-ink-500 mt-1">{money(o.total)}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-ink-900 mb-3 flex items-center gap-2">
          <Zap size={18} className="text-amber-500" /> Available jobs
        </h2>
        {available.length === 0 && <p className="text-sm text-ink-400">No available jobs right now.</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          {available.map((o: any) => (
            <div key={o.id} className="card p-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-ink-900">#{o.order_number} · {o.vendors?.name}</span>
                <span className="text-sm font-semibold text-brand-700">{money(o.total)}</span>
              </div>
              <p className="text-xs text-ink-500 flex items-center gap-1 mt-1">
                <MapPin size={12} /> Pickup + dropoff · est. $12.50 pay
              </p>
              <div className="mt-3">
                <AcceptJobButton orderId={o.id} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
