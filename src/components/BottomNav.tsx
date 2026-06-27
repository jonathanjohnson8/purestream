"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ShoppingCart,
  Package,
  User,
  Truck,
  DollarSign,
  LayoutDashboard,
  Boxes,
  ClipboardList,
  Route,
} from "lucide-react";

// Icon registry — layouts (Server Components) pass a string key, which is
// serializable across the server→client boundary. The component itself is
// resolved here on the client.
const ICONS = {
  home: Home,
  cart: ShoppingCart,
  package: Package,
  user: User,
  truck: Truck,
  dollar: DollarSign,
  dashboard: LayoutDashboard,
  boxes: Boxes,
  clipboard: ClipboardList,
  route: Route,
} as const;

export type IconKey = keyof typeof ICONS;

export interface NavItem {
  href: string;
  label: string;
  icon: IconKey;
}

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-30 border-t border-gray-100 bg-white/95 backdrop-blur">
      <ul className="flex">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          const Icon = ICONS[it.icon];
          return (
            <li key={it.href} className="flex-1">
              <Link
                href={it.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                  active ? "text-brand-700" : "text-ink-500"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 1.9} />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
