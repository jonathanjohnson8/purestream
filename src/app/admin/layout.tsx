import { redirect } from "next/navigation";
import { LayoutDashboard, ClipboardList, Route } from "lucide-react";
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
          { href: "/admin", label: "Overview", icon: LayoutDashboard },
          { href: "/admin/orders", label: "Orders", icon: ClipboardList },
          { href: "/admin/dispatch", label: "Dispatch", icon: Route },
        ]}
      />
    </div>
  );
}
