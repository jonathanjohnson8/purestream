"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Trash2, Plus, Minus, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart/CartContext";
import { computePricing } from "@/lib/pricing";
import { money } from "@/lib/format";

export default function CartPage() {
  const { lines, setQty, remove, vendorName, count } = useCart();
  const router = useRouter();

  const pricing = computePricing({
    lines: lines.map((l) => ({ unit_price: l.price, quantity: l.qty, deposit_amount: l.deposit })),
    flatDeliveryFee: 9.99,
  });

  if (count === 0) {
    return (
      <main className="px-5 pt-12 pb-28">
        <Link href="/shop" className="inline-flex items-center gap-1 text-ink-500 mb-8">
          <ChevronLeft size={20} /> Shop
        </Link>
        <div className="grid place-items-center text-center py-20">
          <span className="grid place-items-center w-20 h-20 rounded-full bg-brand-50 text-brand-400 mb-4">
            <ShoppingCart size={36} />
          </span>
          <h1 className="text-xl font-bold text-ink-900">Your cart is empty</h1>
          <p className="text-ink-500 mt-1">Browse vendors and add some water.</p>
          <Link href="/shop" className="btn-primary mt-6">Start shopping</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="px-5 pt-12 pb-40">
      <Link href="/shop" className="inline-flex items-center gap-1 text-ink-500 mb-4">
        <ChevronLeft size={20} /> Shop
      </Link>
      <h1 className="text-2xl font-bold text-ink-900">Your cart</h1>
      <p className="text-ink-500 text-sm">From {vendorName}</p>

      <div className="mt-5 space-y-3">
        {lines.map((l) => (
          <div key={l.productId} className="card p-4 flex gap-3 items-center">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-ink-900 leading-tight">{l.name}</h3>
              <p className="text-sm text-ink-500">
                {money(l.price)}{l.deposit > 0 && ` + ${money(l.deposit)} deposit`}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-brand-50 rounded-full px-1.5 py-1">
              <button onClick={() => setQty(l.productId, l.qty - 1)} className="grid place-items-center w-7 h-7 rounded-full bg-white text-brand-700">
                <Minus size={15} />
              </button>
              <span className="font-semibold text-brand-700 w-5 text-center text-sm">{l.qty}</span>
              <button onClick={() => setQty(l.productId, l.qty + 1)} className="grid place-items-center w-7 h-7 rounded-full bg-brand-600 text-white">
                <Plus size={15} />
              </button>
            </div>
            <button onClick={() => remove(l.productId)} className="text-ink-300 hover:text-red-500 p-1">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className="card p-4 mt-5 space-y-2 text-sm">
        <Row label="Subtotal" value={money(pricing.subtotal)} />
        <Row label="Delivery fee" value={money(pricing.delivery_fee)} />
        <Row label="Service fee (8%)" value={money(pricing.service_fee)} />
        {pricing.deposit_total > 0 && <Row label="Bottle deposits" value={money(pricing.deposit_total)} />}
        <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-ink-900 text-base">
          <span>Estimated total</span>
          <span>{money(pricing.total)}</span>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 px-5" style={{ maxWidth: 480, margin: "0 auto" }}>
        <button onClick={() => router.push("/checkout")} className="btn-primary w-full">
          Go to checkout · {money(pricing.total)}
        </button>
      </div>
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
