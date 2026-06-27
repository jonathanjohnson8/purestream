import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { getSessionUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <div className="app-shell flex flex-col">
      <div className="flex-1">{children}</div>
      <BottomNav
        items={[
          { href: "/admin", label: "Overview", icon: "dashboard" },
          { href: "/admin/orders", label: "Orders", icon: "clipboard" },
          { href: "/admin/dispatch", label: "Dispatch", icon: "route" },
        ]}
      />
    </div>
  );
}
