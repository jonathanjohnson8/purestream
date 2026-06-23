"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface CartLine {
  productId: string;
  name: string;
  price: number;
  deposit: number;
  weight: number;
  vendorId: string;
  vendorName: string;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  vendorId: string | null;
  vendorName: string | null;
  count: number;
}

const CartCtx = createContext<CartState | null>(null);
const KEY = "purestream.cart.v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {}
  }, [lines]);

  function add(line: Omit<CartLine, "qty">, qty = 1) {
    setLines((prev) => {
      // PureStream carts are single-vendor (orders are per-vendor). Switching vendor resets cart.
      const differentVendor = prev.length > 0 && prev[0].vendorId !== line.vendorId;
      const base = differentVendor ? [] : prev;
      const existing = base.find((l) => l.productId === line.productId);
      if (existing) {
        return base.map((l) =>
          l.productId === line.productId ? { ...l, qty: l.qty + qty } : l
        );
      }
      return [...base, { ...line, qty }];
    });
  }

  function setQty(productId: string, qty: number) {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.productId !== productId)
        : prev.map((l) => (l.productId === productId ? { ...l, qty } : l))
    );
  }

  const value = useMemo<CartState>(
    () => ({
      lines,
      add,
      setQty,
      remove: (id) => setLines((p) => p.filter((l) => l.productId !== id)),
      clear: () => setLines([]),
      vendorId: lines[0]?.vendorId ?? null,
      vendorName: lines[0]?.vendorName ?? null,
      count: lines.reduce((s, l) => s + l.qty, 0),
    }),
    [lines]
  );

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
