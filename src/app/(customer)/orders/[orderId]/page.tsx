import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Package, Receipt, CheckCircle2, Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { OrderTracker } from "@/components/order/OrderTracker";
import { LiveMap } from "@/components/order/LiveMap";
import { ChatPanel } from "@/components/order/ChatPanel";
import { SubstitutionPanel } from "@/components/order/SubstitutionPanel";
import { StatusBadge } from "@/components/StatusBadge";
import { money, timeWindow } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OrderDetail({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const supabase = await createClient();
  const me = await getSessionUser();

  const { data: order } = await supabase
    .from("orders")
    .select("*, vendors(name)")
    .eq("id", orderId)
    .single();
  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);

  const { data: subs } = await supabase
    .from("substitutions")
    .select("id,suggested_name_snapshot,suggested_price,suggested_quantity,status,customer_decision")
    .eq("order_id", orderId);

  const { data: thread } = await supabase
    .from("chat_threads")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  const { data: messages } = thread
    ? await supabase
        .from("chat_messages")
        .select("id,sender_user_id,body,created_at")
        .eq("thread_id", thread.id)
        .order("created_at")
    : { data: [] };

  // Address + vendor coords for the map
  const { data: addr } = order.delivery_address_id
    ? await supabase.from("addresses").select("latitude,longitude").eq("id", order.delivery_address_id).maybeSingle()
    : { data: null };

  // Shopper assigned via route
  const { data: stop } = await supabase
    .from("route_stops")
    .select("route_id, routes(shopper_id)")
    .eq("order_id", orderId)
    .limit(1)
    .maybeSingle();
  const shopperId = (stop as any)?.routes?.shopper_id ?? null;
  const { data: shopper } = shopperId
    ? await supabase.from("shoppers").select("current_lat,current_lng").eq("id", shopperId).maybeSingle()
    : { data: null };

  const { data: proof } = await supabase
    .from("delivery_proofs")
    .select("photo_url,signed_by_name,notes,created_at")
    .eq("order_id", orderId)
    .maybeSingle();

  const status = order.status as OrderStatus;

  return (
    <main className="px-5 pt-12 pb-28 space-y-4">
      <Link href="/orders" className="inline-flex items-center gap-1 text-ink-500">
        <ChevronLeft size={20} /> Orders
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Order #{order.order_number}</h1>
          <p className="text-sm text-ink-500">{order.vendors?.name}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <p className="text-sm text-ink-500 -mt-2">
        {timeWindow(order.scheduled_window_start, order.scheduled_window_end)}
      </p>

      {["shopper_assigned", "shopping", "picked_up", "out_for_delivery"].includes(status) && (
        <LiveMap
          shopperId={shopperId}
          initialShopper={shopper?.current_lat ? { lat: shopper.current_lat, lng: shopper.current_lng } : null}
          destination={addr?.latitude ? { lat: addr.latitude, lng: addr.longitude } : null}
          vendor={null}
        />
      )}

      <SubstitutionPanel orderId={orderId} initial={subs ?? []} />

      <OrderTracker status={status} />

      {/* Items */}
      <section className="card p-4">
        <h2 className="font-semibold text-ink-900 flex items-center gap-2 mb-3">
          <Package size={18} className="text-brand-600" /> Items
        </h2>
        <ul className="space-y-2">
          {(items ?? []).map((it: any) => (
            <li key={it.id} className="flex justify-between text-sm">
              <span className={it.status === "refunded" ? "line-through text-ink-300" : "text-ink-700"}>
                {it.quantity}× {it.product_name_snapshot}
                {it.status === "substituted" && <span className="chip bg-brand-50 text-brand-700 ml-2">substituted</span>}
              </span>
              <span className="text-ink-900">{money(it.unit_price * it.quantity)}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Proof of delivery */}
      {proof && (
        <section className="card p-4">
          <h2 className="font-semibold text-ink-900 flex items-center gap-2 mb-3">
            <CheckCircle2 size={18} className="text-brand-600" /> Delivered
          </h2>
          {proof.photo_url && (
            <img src={proof.photo_url} alt="Proof of delivery" className="rounded-xl w-full h-40 object-cover mb-2" />
          )}
          <p className="text-sm text-ink-500 flex items-center gap-1">
            <Camera size={14} /> Signed by {proof.signed_by_name}
          </p>
          {proof.notes && <p className="text-sm text-ink-500 mt-1">{proof.notes}</p>}
        </section>
      )}

      {/* Receipt */}
      <section className="card p-4 space-y-1.5 text-sm">
        <h2 className="font-semibold text-ink-900 flex items-center gap-2 mb-2">
          <Receipt size={18} className="text-brand-600" /> Receipt
        </h2>
        <Row label="Subtotal" value={money(order.subtotal)} />
        <Row label="Delivery fee" value={money(order.delivery_fee)} />
        <Row label="Service fee" value={money(order.service_fee)} />
        {order.deposit_total > 0 && <Row label="Bottle deposits" value={money(order.deposit_total)} />}
        {order.discount_total > 0 && <Row label="Discount" value={`–${money(order.discount_total)}`} />}
        {order.credits_applied > 0 && <Row label="Credits" value={`–${money(order.credits_applied)}`} />}
        <div className="border-t border-gray-100 pt-1.5 flex justify-between font-bold text-ink-900">
          <span>Total</span>
          <span>{money(order.total)}</span>
        </div>
      </section>

      {/* Chat */}
      {!["completed", "canceled", "refunded"].includes(status) && me && (
        <ChatPanel orderId={orderId} threadId={thread?.id ?? null} meId={me.id} initial={(messages as any) ?? []} />
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-ink-700">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
