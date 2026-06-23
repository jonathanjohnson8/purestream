import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingBag, Truck, Store, ShieldCheck, ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { getSessionUser, homeForRoles } from "@/lib/auth";

const SURFACES = [
  { href: "/shop", label: "Shop water", desc: "Browse vendors & order", icon: ShoppingBag },
  { href: "/shopper", label: "Shopper / Driver", desc: "Pick up & deliver", icon: Truck },
  { href: "/vendor", label: "Vendor", desc: "Manage catalog & orders", icon: Store },
  { href: "/admin", label: "Admin / Ops", desc: "Dispatch & oversight", icon: ShieldCheck },
];

export default async function Home() {
  const user = await getSessionUser();
  if (user) redirect(homeForRoles(user.roles));

  return (
    <main className="app-shell flex flex-col">
      <div className="bg-gradient-to-b from-brand-600 to-brand-700 text-white px-6 pt-14 pb-20 rounded-b-[2rem]">
        <Logo />
        <h1 className="mt-10 text-3xl font-bold leading-tight">
          Bulk water,<br />delivered to your door.
        </h1>
        <p className="mt-3 text-brand-50/90">
          On-demand & scheduled delivery from local water brands. Live tracking,
          bottle credits, and business pricing.
        </p>
        <Link href="/login" className="btn-primary mt-6 bg-white !text-brand-700 hover:bg-brand-50">
          Get started <ArrowRight size={18} />
        </Link>
      </div>

      <div className="px-5 -mt-10 pb-10 space-y-3">
        <p className="text-sm font-semibold text-ink-500 px-1">Choose a workspace</p>
        {SURFACES.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href="/login" className="card flex items-center gap-4 p-4 hover:shadow-float transition">
              <span className="grid place-items-center w-12 h-12 rounded-xl bg-brand-50 text-brand-700">
                <Icon size={24} />
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-ink-900">{s.label}</span>
                <span className="block text-sm text-ink-500">{s.desc}</span>
              </span>
              <ArrowRight size={18} className="text-ink-300" />
            </Link>
          );
        })}
        <p className="text-center text-xs text-ink-300 pt-4">
          PureStream · Proof of concept
        </p>
      </div>
    </main>
  );
}
