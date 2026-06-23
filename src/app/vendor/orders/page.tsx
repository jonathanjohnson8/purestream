import { ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vendorContext";
import { StatusBadge } from "@/components/StatusBadge";
import { VendorOrderActions } from "@/components/vendor/VendorOrderActions";
import { money, shortDate } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function VendorOrders() {
  const vendor = await getCurrentVendor();
  if (!vendor) {
    return <main className="px-5 pt-12"><p className="text-ink-500">Link a vendor first (Dashboard tab).</p></main>;
  }
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id,order_number,status,total,created_at")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  return (
    <main className="px-5 pt-12 pb-28 space-y-4">
      <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
        <ClipboardList size={22} className="text-brand-600" /> Orders
      </h1>
      {(!orders || orders.length === 0) && <p className="text-sm text-ink-400">No orders yet.</p>}
      <div className="space-y-3">
        {(orders ?? []).map((o: any) => (
          <div key={o.id} className="card p-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-ink-900">#{o.order_number}</span>
              <StatusBadge status={o.status as OrderStatus} />
            </div>
            <p className="text-sm text-ink-500 mt-1">{shortDate(o.created_at)} · {money(o.total)}</p>
            {o.status === "vendor_pending" && <VendorOrderActions orderId={o.id} />}
          </div>
        ))}
      </div>
    </main>
  );
}
