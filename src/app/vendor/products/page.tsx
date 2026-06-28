import { Boxes } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor, getManagedVendors } from "@/lib/vendorContext";
import { ProductRow } from "@/components/vendor/ProductRow";
import { VendorChip } from "@/components/vendor/VendorChip";

export const dynamic = "force-dynamic";

export default async function VendorProducts() {
  const vendor = await getCurrentVendor();
  if (!vendor) {
    return <main className="px-5 pt-12"><p className="text-ink-500">Link a vendor first (Dashboard tab).</p></main>;
  }

  const supabase = await createClient();
  const managed = await getManagedVendors();
  const { data: products } = await supabase
    .from("products")
    .select("id,name,price,category")
    .eq("vendor_id", vendor.id)
    .order("category");

  const { data: avail } = await supabase
    .from("product_availability")
    .select("product_id,availability_status,products!inner(vendor_id)")
    .eq("products.vendor_id", vendor.id);
  const statusMap = new Map<string, string>();
  (avail ?? []).forEach((a: any) => {
    const cur = statusMap.get(a.product_id);
    if (a.availability_status === "available" || !cur) statusMap.set(a.product_id, a.availability_status);
  });

  return (
    <main className="px-5 pt-12 pb-28 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
          <Boxes size={22} className="text-brand-600" /> Catalog
        </h1>
        <VendorChip vendors={managed.map((m) => ({ id: m.id, name: m.name }))} currentId={vendor.id} />
      </div>
      <p className="text-sm text-ink-500 -mt-2">Tap a price to edit. Toggle availability for stockouts.</p>
      <div className="space-y-3">
        {(products ?? []).map((p: any) => (
          <ProductRow key={p.id} id={p.id} name={p.name} price={Number(p.price)} status={statusMap.get(p.id) ?? "available"} />
        ))}
      </div>
    </main>
  );
}
