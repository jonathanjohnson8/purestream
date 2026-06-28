import Link from "next/link";
import { ShoppingBag, Truck, Store, ShieldCheck, ChevronRight } from "lucide-react";

const SURFACES = [
  { href: "/shop", label: "Customer", desc: "Shop & order", icon: ShoppingBag },
  { href: "/shopper", label: "Shopper / Driver", desc: "Pick up & deliver", icon: Truck },
  { href: "/vendor", label: "Vendor", desc: "Catalog & orders", icon: Store },
  { href: "/admin", label: "Admin / Ops", desc: "Dispatch & oversight", icon: ShieldCheck },
];

/** Links to the other role surfaces. Pass `current` to hide the active one. */
export function WorkspaceSwitcher({ current }: { current?: string }) {
  const items = SURFACES.filter((s) => s.href !== current);
  return (
    <section className="card p-4">
      <h2 className="font-semibold text-ink-900 mb-1">Switch workspace</h2>
      <p className="text-xs text-ink-400 mb-3">Jump to another surface on the same account.</p>
      <div className="divide-y divide-gray-50">
        {items.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href} className="flex items-center gap-3 py-3">
              <span className="grid place-items-center w-10 h-10 rounded-xl bg-brand-50 text-brand-600">
                <Icon size={20} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium text-ink-900">{s.label}</span>
                <span className="block text-xs text-ink-500">{s.desc}</span>
              </span>
              <ChevronRight size={18} className="text-ink-300" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
