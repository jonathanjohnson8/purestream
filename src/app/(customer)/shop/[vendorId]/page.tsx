import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Droplets } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AvailabilityDot } from "@/components/StatusBadge";
import { AddButton } from "@/components/cart/AddButton";
import { money } from "@/lib/format";

export default async function VendorCatalog({
  params,
}: {
  params: Promise<{ vendorId: string }>;
}) {
  const { vendorId } = await params;
  const supabase = await createClient();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id,name,description")
    .eq("id", vendorId)
    .single();
  if (!vendor) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("id,name,description,category,unit_size,weight_lbs,deposit_amount,price,vendor_id")
    .eq("vendor_id", vendorId)
    .eq("status", "active")
    .order("category");

  // availability (any location available => available)
  const { data: avail } = await supabase
    .from("product_availability")
    .select("product_id,availability_status");
  const availMap = new Map<string, string>();
  (avail ?? []).forEach((a: { product_id: string; availability_status: string }) => {
    const cur = availMap.get(a.product_id);
    if (a.availability_status === "available" || !cur) availMap.set(a.product_id, a.availability_status);
  });

  const categories = Array.from(
    new Set((products ?? []).map((p: { category: string | null }) => p.category ?? "Other"))
  );

  return (
    <main className="pb-28">
      <header className="bg-gradient-to-b from-brand-600 to-brand-700 text-white px-5 pt-12 pb-6 rounded-b-3xl">
        <Link href="/shop" className="inline-flex items-center gap-1 text-brand-50 mb-3">
          <ChevronLeft size={20} /> Vendors
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Droplets size={24} /> {vendor.name}
        </h1>
        <p className="text-brand-50/90 text-sm mt-1">{vendor.description}</p>
      </header>

      <div className="px-5 mt-5 space-y-6">
        {categories.map((cat) => (
          <section key={cat}>
            <h2 className="font-semibold text-ink-900 mb-3">{cat}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(products ?? [])
                .filter((p: { category: string | null }) => (p.category ?? "Other") === cat)
                .map((p: any) => {
                  const status = availMap.get(p.id) ?? "available";
                  const unavailable = status === "unavailable";
                  return (
                    <div key={p.id} className="card p-4 flex gap-4">
                      <span className="grid place-items-center w-16 h-16 rounded-xl bg-brand-50 text-brand-400 shrink-0">
                        <Droplets size={30} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <h3 className="font-semibold text-ink-900 leading-tight">{p.name}</h3>
                          <span className="font-bold text-ink-900 whitespace-nowrap">{money(p.price)}</span>
                        </div>
                        <p className="text-xs text-ink-500 mt-0.5 line-clamp-2">{p.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <AvailabilityDot status={status} />
                          {p.deposit_amount > 0 && (
                            <span className="chip bg-amber-50 text-amber-700">
                              +{money(p.deposit_amount)} deposit
                            </span>
                          )}
                        </div>
                        <div className="mt-3">
                          <AddButton
                            disabled={unavailable}
                            line={{
                              productId: p.id,
                              name: p.name,
                              price: Number(p.price),
                              deposit: Number(p.deposit_amount),
                              weight: Number(p.weight_lbs),
                              vendorId: vendor.id,
                              vendorName: vendor.name,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
