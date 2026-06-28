import { ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { RefundButton } from "@/components/admin/AdminButtons";
import { money, shortDate } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminOrders() {
  const me = await getSessionUser();
  if (!me?.roles.includes("admin") && !me?.roles.includes("support")) {
    return <main className="px-5 pt-12"><p className="text-ink-500">Enable admin access on the Overview tab.</p></main>;
  }
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id,order_number,status,total,created_at,vendors(name)")
    .order("created_at", { ascending: false });

  return (
    <main className="px-5 pt-12 pb-28 space-y-4">
      <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
        <ClipboardList size={22} className="text-brand-600" /> All orders
      </h1>
      {(!orders || orders.length === 0) && <p className="text-sm text-ink-400">No orders yet.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {(orders ?? []).map((o: any) => (
          <div key={o.id} className="card p-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-ink-900">#{o.order_number} · {o.vendors?.name}</span>
              <StatusBadge status={o.status as OrderStatus} />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-ink-500">{shortDate(o.created_at)} · {money(o.total)}</span>
              {!["refunded", "canceled"].includes(o.status) && <RefundButton orderId={o.id} />}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
