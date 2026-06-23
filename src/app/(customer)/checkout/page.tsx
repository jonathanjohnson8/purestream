"use client";

import { useState, useEffect, useActionState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { ChevronLeft, MapPin, Clock, Tag, CreditCard } from "lucide-react";
import { useCart } from "@/components/cart/CartContext";
import { computePricing, type PromoInput } from "@/lib/pricing";
import { money } from "@/lib/format";
import { placeOrder } from "./actions";

const PROMOS: Record<string, PromoInput> = {
  WELCOME10: { promo_type: "percent", value: 10 },
  FREEDELIV: { promo_type: "free_delivery", value: 0 },
  H2O5: { promo_type: "fixed", value: 5 },
};

function PlaceBtn({ total }: { total: number }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? "Placing order…" : `Place order · ${money(total)}`}
    </button>
  );
}

export default function CheckoutPage() {
  const { lines, vendorId, clear } = useCart();
  const [schedule, setSchedule] = useState<"now" | "later">("now");
  const [promo, setPromo] = useState("");
  const [state, formAction] = useActionState(placeOrder, null as { error?: string } | null);

  // Clear cart once the order action redirects away successfully.
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/orders/")) clear();
    };
  }, [clear]);

  const appliedPromo = PROMOS[promo.trim().toUpperCase()] ?? null;
  const pricing = computePricing({
    lines: lines.map((l) => ({ unit_price: l.price, quantity: l.qty, deposit_amount: l.deposit })),
    flatDeliveryFee: 9.99,
    promo: appliedPromo,
  });

  // default scheduled window: tomorrow 9am
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  return (
    <main className="px-5 pt-12 pb-40">
      <Link href="/cart" className="inline-flex items-center gap-1 text-ink-500 mb-4">
        <ChevronLeft size={20} /> Cart
      </Link>
      <h1 className="text-2xl font-bold text-ink-900 mb-5">Checkout</h1>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="vendorId" value={vendorId ?? ""} />
        <input
          type="hidden"
          name="lines"
          value={JSON.stringify(lines.map((l) => ({ productId: l.productId, qty: l.qty })))}
        />

        {/* Address */}
        <section className="card p-4">
          <h2 className="font-semibold text-ink-900 flex items-center gap-2 mb-3">
            <MapPin size={18} className="text-brand-600" /> Delivery address
          </h2>
          <input name="street" className="input mb-2" placeholder="Street address" defaultValue="2400 S Lamar Blvd" required />
          <div className="flex gap-2">
            <input name="city" className="input" placeholder="City" defaultValue="Austin" />
            <input name="postal" className="input" placeholder="ZIP" defaultValue="78704" />
          </div>
          <input name="instructions" className="input mt-2" placeholder="Delivery instructions (e.g. leave at side door, 2 flights of stairs)" />
        </section>

        {/* Schedule */}
        <section className="card p-4">
          <h2 className="font-semibold text-ink-900 flex items-center gap-2 mb-3">
            <Clock size={18} className="text-brand-600" /> When
          </h2>
          <input type="hidden" name="schedule" value={schedule} />
          <input type="hidden" name="windowStart" value={schedule === "later" ? tomorrow.toISOString() : ""} />
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setSchedule("now")} className={`rounded-xl border px-4 py-3 text-sm font-medium ${schedule === "now" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-ink-700"}`}>
              On-demand (ASAP)
            </button>
            <button type="button" onClick={() => setSchedule("later")} className={`rounded-xl border px-4 py-3 text-sm font-medium ${schedule === "later" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-ink-700"}`}>
              Tomorrow 9–11am
            </button>
          </div>
        </section>

        {/* Promo */}
        <section className="card p-4">
          <h2 className="font-semibold text-ink-900 flex items-center gap-2 mb-3">
            <Tag size={18} className="text-brand-600" /> Promo code
          </h2>
          <input name="promoCode" value={promo} onChange={(e) => setPromo(e.target.value)} className="input" placeholder="WELCOME10 · FREEDELIV · H2O5" />
          {promo && (appliedPromo ? <p className="text-xs text-brand-700 mt-1">Promo applied ✓</p> : <p className="text-xs text-ink-400 mt-1">Enter a valid code</p>)}
        </section>

        {/* Payment (mock) */}
        <section className="card p-4">
          <h2 className="font-semibold text-ink-900 flex items-center gap-2 mb-2">
            <CreditCard size={18} className="text-brand-600" /> Payment
          </h2>
          <p className="text-sm text-ink-500">Visa •••• 4242 — <span className="text-ink-400">(mock, test mode)</span></p>
        </section>

        {/* Summary */}
        <section className="card p-4 space-y-2 text-sm">
          <Row label="Subtotal" value={money(pricing.subtotal)} />
          <Row label="Delivery fee" value={money(pricing.delivery_fee)} />
          <Row label="Service fee" value={money(pricing.service_fee)} />
          {pricing.deposit_total > 0 && <Row label="Bottle deposits" value={money(pricing.deposit_total)} />}
          {pricing.discount_total > 0 && <Row label="Discount" value={`–${money(pricing.discount_total)}`} />}
          <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-ink-900 text-base">
            <span>Total</span><span>{money(pricing.total)}</span>
          </div>
        </section>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <PlaceBtn total={pricing.total} />
      </form>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-ink-700"><span>{label}</span><span>{value}</span></div>
  );
}
