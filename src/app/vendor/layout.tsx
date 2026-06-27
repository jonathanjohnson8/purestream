import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { getSessionUser } from "@/lib/auth";

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <div className="app-shell flex flex-col">
      <div className="flex-1">{children}</div>
      <BottomNav
        items={[
          { href: "/vendor", label: "Dashboard", icon: "dashboard" },
          { href: "/vendor/products", label: "Catalog", icon: "boxes" },
          { href: "/vendor/orders", label: "Orders", icon: "clipboard" },
        ]}
      />
    </div>
  );
}
