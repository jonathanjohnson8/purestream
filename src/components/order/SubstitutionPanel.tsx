"use client";

import { useEffect, useState, useTransition } from "react";
import { RefreshCw, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { decideSubstitution } from "@/lib/orderActions";
import { money } from "@/lib/format";

interface Sub {
  id: string;
  suggested_name_snapshot: string | null;
  suggested_price: number | null;
  suggested_quantity: number | null;
  status: string;
  customer_decision: string;
}

export function SubstitutionPanel({
  orderId,
  initial,
}: {
  orderId: string;
  initial: Sub[];
}) {
  const [subs, setSubs] = useState<Sub[]>(initial);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`subs-${orderId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "substitutions", filter: `order_id=eq.${orderId}` },
        (payload: any) => {
          setSubs((prev) => {
            const row = payload.new as Sub;
            const exists = prev.find((s) => s.id === row.id);
            if (exists) return prev.map((s) => (s.id === row.id ? row : s));
            return [...prev, row];
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const pendingSubs = subs.filter((s) => s.status === "pending");
  if (pendingSubs.length === 0) return null;

  return (
    <div className="card p-4 border-orange-200 bg-orange-50/40">
      <div className="flex items-center gap-2 mb-3">
        <RefreshCw size={18} className="text-orange-600" />
        <h2 className="font-semibold text-ink-900">Substitution needs your approval</h2>
      </div>
      <div className="space-y-3">
        {pendingSubs.map((s) => (
          <div key={s.id} className="bg-white rounded-xl p-3 border border-orange-100">
            <p className="text-sm text-ink-700">Your shopper suggests:</p>
            <p className="font-semibold text-ink-900">
              {s.suggested_quantity}× {s.suggested_name_snapshot} · {money(s.suggested_price ?? 0)}
            </p>
            <div className="flex gap-2 mt-3">
              <button
                disabled={pending}
                onClick={() => startTransition(() => void decideSubstitution(s.id, true))}
                className="btn-primary flex-1 !py-2"
              >
                <Check size={16} /> Approve
              </button>
              <button
                disabled={pending}
                onClick={() => startTransition(() => void decideSubstitution(s.id, false))}
                className="btn flex-1 !py-2 bg-white border border-gray-200 text-ink-700"
              >
                <X size={16} /> Skip item
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
