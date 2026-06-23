import { Droplets, Wallet, LogOut, Recycle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import { money, shortDate } from "@/lib/format";
import { initials } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const me = await getSessionUser();

  const { data: credits } = await supabase
    .from("credits")
    .select("amount")
    .eq("owner_type", "user")
    .eq("owner_id", me?.id ?? "");
  const creditBalance = (credits ?? []).reduce((s: number, c: { amount: number }) => s + Number(c.amount), 0);

  const { data: bottles } = await supabase
    .from("bottle_transactions")
    .select("transaction_type,bottle_count,amount,created_at")
    .eq("customer_user_id", me?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <main className="px-5 pt-12 pb-28 space-y-5">
      <div className="flex items-center gap-3">
        <span className="grid place-items-center w-14 h-14 rounded-full bg-brand-600 text-white font-bold text-lg">
          {initials(me?.name)}
        </span>
        <div>
          <h1 className="text-xl font-bold text-ink-900">{me?.name ?? "Customer"}</h1>
          <p className="text-sm text-ink-500">{me?.email}</p>
        </div>
      </div>

      <div className="card p-4 flex items-center gap-3">
        <span className="grid place-items-center w-11 h-11 rounded-xl bg-brand-50 text-brand-600">
          <Wallet size={22} />
        </span>
        <div className="flex-1">
          <p className="text-sm text-ink-500">PureStream credit balance</p>
          <p className="text-2xl font-bold text-ink-900">{money(creditBalance)}</p>
        </div>
      </div>

      <section className="card p-4">
        <h2 className="font-semibold text-ink-900 flex items-center gap-2 mb-3">
          <Recycle size={18} className="text-brand-600" /> Bottle activity
        </h2>
        {(!bottles || bottles.length === 0) && <p className="text-sm text-ink-400">No bottle activity yet.</p>}
        <ul className="space-y-2">
          {(bottles ?? []).map((b: any, i: number) => (
            <li key={i} className="flex justify-between text-sm">
              <span className="text-ink-700 capitalize">
                {b.transaction_type.replaceAll("_", " ")} ({b.bottle_count})
              </span>
              <span className="text-ink-500">{shortDate(b.created_at)} · {money(b.amount)}</span>
            </li>
          ))}
        </ul>
      </section>

      <form action={signOut}>
        <button className="btn w-full bg-white border border-gray-200 text-ink-700 py-3">
          <LogOut size={18} /> Sign out
        </button>
      </form>

      <p className="text-center text-xs text-ink-300 flex items-center justify-center gap-1">
        <Droplets size={12} /> PureStream · POC
      </p>
    </main>
  );
}
