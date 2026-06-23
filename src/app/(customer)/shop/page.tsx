import Link from "next/link";
import { MapPin, Clock, ChevronRight, Droplets } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { money } from "@/lib/format";

export default async function ShopPage() {
  const supabase = await createClient();
  const user = await getSessionUser();

  const { data: vendors } = await supabase
    .from("vendors")
    .select("id,name,description,status")
    .eq("status", "active")
    .order("name");

  const { data: zones } = await supabase
    .from("delivery_zones")
    .select("owner_id,flat_delivery_fee")
    .eq("owner_type", "vendor");

  const feeByVendor = new Map<string, number>();
  (zones ?? []).forEach((z: { owner_id: string; flat_delivery_fee: number }) => {
    if (!feeByVendor.has(z.owner_id)) feeByVendor.set(z.owner_id, z.flat_delivery_fee);
  });

  return (
    <main>
      <header className="bg-gradient-to-b from-brand-600 to-brand-700 text-white px-5 pt-12 pb-8 rounded-b-3xl">
        <p className="text-brand-50/90 text-sm">Deliver to</p>
        <button className="flex items-center gap-1 font-semibold text-lg">
          <MapPin size={18} /> Austin, TX 78704 <ChevronRight size={18} />
        </button>
        <p className="mt-3 text-2xl font-bold leading-snug">
          Hi {user?.name?.split(" ")[0] ?? "there"} 👋<br />What water are we stocking up on?
        </p>
      </header>

      <section className="px-5 mt-5">
        <h2 className="font-semibold text-ink-900 mb-3">Water vendors near you</h2>
        <div className="space-y-3">
          {(vendors ?? []).map((v: { id: string; name: string; description: string | null }) => (
            <Link key={v.id} href={`/shop/${v.id}`} className="card block p-4 hover:shadow-float transition">
              <div className="flex items-start gap-3">
                <span className="grid place-items-center w-14 h-14 rounded-xl bg-brand-50 text-brand-600 shrink-0">
                  <Droplets size={26} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-ink-900 truncate">{v.name}</h3>
                    <ChevronRight size={18} className="text-ink-300 shrink-0" />
                  </div>
                  <p className="text-sm text-ink-500 line-clamp-2">{v.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-ink-500">
                    <span className="flex items-center gap-1">
                      <Clock size={13} /> 30–60 min
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={13} /> {money(feeByVendor.get(v.id) ?? 9.99)} delivery
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
