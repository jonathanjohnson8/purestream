import { LogOut, Truck } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import { initials } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ShopperAccount() {
  const me = await getSessionUser();
  return (
    <main className="px-5 pt-12 pb-28 space-y-5">
      <div className="flex items-center gap-3">
        <span className="grid place-items-center w-14 h-14 rounded-full bg-brand-600 text-white font-bold text-lg">
          {initials(me?.name)}
        </span>
        <div>
          <h1 className="text-xl font-bold text-ink-900">{me?.name ?? "Shopper"}</h1>
          <p className="text-sm text-ink-500 flex items-center gap-1"><Truck size={13} /> PureStream driver</p>
        </div>
      </div>
      <form action={signOut}>
        <button className="btn w-full bg-white border border-gray-200 text-ink-700 py-3">
          <LogOut size={18} /> Sign out
        </button>
      </form>
    </main>
  );
}
