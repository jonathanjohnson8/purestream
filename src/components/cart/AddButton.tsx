"use client";

import { Plus, Minus } from "lucide-react";
import { useCart, type CartLine } from "./CartContext";

export function AddButton({
  line,
  disabled,
}: {
  line: Omit<CartLine, "qty">;
  disabled?: boolean;
}) {
  const { lines, add, setQty } = useCart();
  const existing = lines.find((l) => l.productId === line.productId);

  if (disabled) {
    return (
      <button className="btn bg-gray-100 text-gray-400 px-4 py-2 w-full cursor-not-allowed" disabled>
        Unavailable
      </button>
    );
  }

  if (!existing) {
    return (
      <button onClick={() => add(line)} className="btn-secondary w-full">
        <Plus size={18} /> Add to cart
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 bg-brand-50 rounded-full px-2 py-1">
        <button
          onClick={() => setQty(line.productId, existing.qty - 1)}
          className="grid place-items-center w-8 h-8 rounded-full bg-white text-brand-700 shadow-sm"
        >
          <Minus size={16} />
        </button>
        <span className="font-semibold text-brand-700 w-6 text-center">{existing.qty}</span>
        <button
          onClick={() => setQty(line.productId, existing.qty + 1)}
          className="grid place-items-center w-8 h-8 rounded-full bg-brand-600 text-white shadow-sm"
        >
          <Plus size={16} />
        </button>
      </div>
      <span className="text-sm text-ink-500">in cart</span>
    </div>
  );
}
