import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/StatusBadge";
import { ShopperOrderActions } from "@/components/shopper/ShopperOrderActions";
import { money } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ShopperOrder({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, vendors(name), addresses!orders_delivery_address_id_fkey(street,city,postal_code,latitude,longitude,delivery_instructions,stairs_count,has_elevator)")
    .eq("id", orderId)
    .single();
  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("id,product_name_snapshot,quantity,unit_price,status,weight_lbs")
    .eq("order_id", orderId);

  const addr = (order as any).addresses;
  const destination = addr?.latitude ? { lat: addr.latitude, lng: addr.longitude } : null;
  const totalWeight = (items ?? []).reduce((s: number, it: any) => s + Number(it.weight_lbs) * it.quantity, 0);

  return (
    <main className="px-5 pt-12 pb-28 space-y-4">
      <Link href="/shopper" className="inline-flex items-center gap-1 text-ink-500">
        <ChevronLeft size={20} /> Jobs
      </Link>

      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-ink-900">Order #{order.order_number}</h1>
        <StatusBadge status={order.status as OrderStatus} />
      </div>

      <div className="card p-4 space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <Store size={16} className="text-brand-600 mt-0.5" />
          <span className="text-ink-700">Pickup: <b>{order.vendors?.name}</b></span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={16} className="text-ink-700 mt-0.5" />
          <span className="text-ink-700">
            Drop-off: {addr?.street}, {addr?.city} {addr?.postal_code}
            {addr?.delivery_instructions && <em className="block text-ink-500 mt-0.5">"{addr.delivery_instructions}"</em>}
            {addr?.stairs_count > 0 && <span className="block text-xs text-amber-600 mt-0.5">⚠ {addr.stairs_count} flights of stairs{addr.has_elevator ? " (elevator available)" : ""}</span>}
          </span>
        </div>
        <p className="text-xs text-ink-400 pt-1 border-t border-gray-50">
          Load: {totalWeight.toFixed(0)} lbs · Order value {money(order.total)}
        </p>
      </div>

      <ShopperOrderActions
        orderId={orderId}
        status={order.status as OrderStatus}
        items={(items as any) ?? []}
        destination={destination}
      />
    </main>
  );
}
