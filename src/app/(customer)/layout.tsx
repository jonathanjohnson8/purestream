import { redirect } from "next/navigation";
import { Home, ShoppingCart, Package, User } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { CartProvider } from "@/components/cart/CartContext";
import { CartFab } from "@/components/cart/CartFab";
import { getSessionUser } from "@/lib/auth";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <CartProvider>
      <div className="app-shell flex flex-col">
        <div className="flex-1 pb-2">{children}</div>
        <CartFab />
        <BottomNav
          items={[
            { href: "/shop", label: "Shop", icon: Home },
            { href: "/cart", label: "Cart", icon: ShoppingCart },
            { href: "/orders", label: "Orders", icon: Package },
            { href: "/account", label: "Account", icon: User },
          ]}
        />
      </div>
    </CartProvider>
  );
}
