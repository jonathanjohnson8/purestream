import Link from "next/link";
import { Package, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/StatusBadge";
import { money, shortDate } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id,order_number,status,total,created_at,vendor_id,vendors(name)")
    .order("created_at", { ascending: false });

  return (
    <main className="px-5 pt-12 pb-28">
      <h1 className="text-2xl font-bold text-ink-900 mb-5">Your orders</h1>
      {(!orders || orders.length === 0) && (
        <div className="grid place-items-center text-center py-20">
          <span className="grid place-items-center w-20 h-20 rounded-full bg-brand-50 text-brand-400 mb-4">
            <Package size={36} />
          </span>
          <p className="text-ink-500">No orders yet.</p>
          <Link href="/shop" className="btn-primary mt-6">Start an order</Link>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {(orders ?? []).map((o: any) => (
          <Link key={o.id} href={`/orders/${o.id}`} className="card block p-4 hover:shadow-float transition">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink-900">#{o.order_number} · {o.vendors?.name}</span>
              <ChevronRight size={18} className="text-ink-300" />
            </div>
            <div className="flex items-center justify-between mt-2">
              <StatusBadge status={o.status as OrderStatus} />
              <span className="text-sm text-ink-500">{shortDate(o.created_at)} · {money(o.total)}</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
