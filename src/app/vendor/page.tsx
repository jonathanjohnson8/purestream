import Link from "next/link";
import { Store, DollarSign, ClipboardList, AlertTriangle, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vendorContext";
import { VendorActivate } from "@/components/vendor/VendorActivate";
import { VendorOrderActions } from "@/components/vendor/VendorOrderActions";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function VendorDashboard() {
  const vendor = await getCurrentVendor();
  if (!vendor) {
    return (
      <main className="px-5 pt-12 pb-28">
        <h1 className="text-2xl font-bold text-ink-900 mb-2">Vendor dashboard</h1>
        <p className="text-ink-500 mb-6">Link your account to a vendor to manage catalog and orders.</p>
        <div className="card p-6 text-center">
          <span className="grid place-items-center w-16 h-16 rounded-full bg-brand-50 text-brand-600 mx-auto mb-3">
            <Store size={30} />
          </span>
          <VendorActivate />
        </div>
      </main>
    );
  }

  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("id,order_number,status,total,subtotal,created_at,customer_user_id")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  const pendingOrders = (orders ?? []).filter((o: any) => o.status === "vendor_pending");
  const todaySales = (orders ?? [])
    .filter((o: any) => !["canceled", "refunded"].includes(o.status))
    .reduce((s: number, o: any) => s + Number(o.subtotal), 0);

  const { data: lowStock } = await supabase
    .from("product_availability")
    .select("id,availability_status,products!inner(vendor_id)")
    .eq("products.vendor_id", vendor.id)
    .in("availability_status", ["low", "unavailable"]);

  const { data: payouts } = await supabase
    .from("payouts")
    .select("amount,status")
    .eq("recipient_type", "vendor")
    .eq("recipient_id", vendor.id);
  const pendingPayout = (payouts ?? []).filter((p: any) => p.status === "pending").reduce((s: number, p: any) => s + Number(p.amount), 0);

  return (
    <main className="px-5 pt-12 pb-28 space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
          <Store size={22} className="text-brand-600" /> {vendor.name}
        </h1>
        <p className="text-sm text-ink-500">Commission {(vendor.commission_rate * 100).toFixed(0)}%</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Metric icon={DollarSign} label="Sales (gross)" value={money(todaySales)} />
        <Metric icon={ClipboardList} label="Orders" value={String((orders ?? []).length)} />
        <Metric icon={DollarSign} label="Pending payout" value={money(pendingPayout)} tone="brand" />
        <Metric icon={AlertTriangle} label="Low / out of stock" value={String((lowStock ?? []).length)} tone="amber" />
      </div>

      <section>
        <h2 className="font-semibold text-ink-900 mb-3 flex items-center gap-2">
          <Inbox size={18} className="text-brand-600" /> Orders awaiting confirmation
        </h2>
        {pendingOrders.length === 0 && <p className="text-sm text-ink-400">Nothing waiting. You're all caught up.</p>}
        <div className="space-y-3">
          {pendingOrders.map((o: any) => (
            <div key={o.id} className="card p-4">
              <div className="flex justify-between">
                <span className="font-semibold text-ink-900">#{o.order_number}</span>
                <span className="font-semibold text-ink-900">{money(o.total)}</span>
              </div>
              <p className="text-xs text-ink-500">New order · confirm availability to release to dispatch</p>
              <VendorOrderActions orderId={o.id} />
            </div>
          ))}
        </div>
      </section>

      <Link href="/vendor/orders" className="btn w-full bg-white border border-gray-200 text-ink-700 py-3">
        View all orders
      </Link>
    </main>
  );
}

function Metric({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone?: "brand" | "amber" }) {
  const color = tone === "brand" ? "text-brand-700" : tone === "amber" ? "text-amber-600" : "text-ink-900";
  return (
    <div className="card p-4">
      <p className="text-xs text-ink-500 flex items-center gap-1"><Icon size={13} /> {label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
