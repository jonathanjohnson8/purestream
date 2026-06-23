"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useCart } from "./CartContext";

export function CartFab() {
  const { count } = useCart();
  const pathname = usePathname();
  if (count === 0 || pathname === "/cart" || pathname === "/checkout") return null;
  return (
    <Link
      href="/cart"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 btn-primary shadow-float"
      style={{ maxWidth: 440 }}
    >
      <ShoppingCart size={18} />
      View cart · {count} item{count > 1 ? "s" : ""}
    </Link>
  );
}
