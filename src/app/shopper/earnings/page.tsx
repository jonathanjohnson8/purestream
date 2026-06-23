import { DollarSign, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { money, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Earnings() {
  const supabase = await createClient();
  const me = await getSessionUser();
  const { data: shopper } = await supabase.from("shoppers").select("id").eq("user_id", me?.id ?? "").maybeSingle();

  const { data: payouts } = shopper
    ? await supabase
        .from("payouts")
        .select("amount,status,created_at,order_id")
        .eq("recipient_type", "shopper")
        .eq("recipient_id", shopper.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const total = (payouts ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0);
  const pending = (payouts ?? []).filter((p: any) => p.status === "pending").reduce((s: number, p: any) => s + Number(p.amount), 0);

  return (
    <main className="px-5 pt-12 pb-28 space-y-5">
      <h1 className="text-2xl font-bold text-ink-900">Earnings</h1>
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-sm text-ink-500 flex items-center gap-1"><TrendingUp size={14} /> Total</p>
          <p className="text-2xl font-bold text-ink-900">{money(total)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-ink-500 flex items-center gap-1"><DollarSign size={14} /> Pending</p>
          <p className="text-2xl font-bold text-brand-700">{money(pending)}</p>
        </div>
      </div>

      <section className="card p-4">
        <h2 className="font-semibold text-ink-900 mb-3">Payout history</h2>
        {(!payouts || payouts.length === 0) && <p className="text-sm text-ink-400">No payouts yet. Complete a delivery to earn.</p>}
        <ul className="space-y-2">
          {(payouts ?? []).map((p: any, i: number) => (
            <li key={i} className="flex justify-between text-sm">
              <span className="text-ink-700">Delivery payout</span>
              <span className="text-ink-500">{shortDate(p.created_at)} · <b className="text-ink-900">{money(p.amount)}</b> · {p.status}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
