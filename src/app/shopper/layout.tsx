import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { getSessionUser } from "@/lib/auth";

export default async function ShopperLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <div className="app-shell flex flex-col">
      <div className="flex-1">{children}</div>
      <BottomNav
        items={[
          { href: "/shopper", label: "Jobs", icon: "truck" },
          { href: "/shopper/earnings", label: "Earnings", icon: "dollar" },
          { href: "/shopper/account", label: "Account", icon: "user" },
        ]}
      />
    </div>
  );
}
