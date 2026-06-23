"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Route, RotateCcw } from "lucide-react";
import { claimAdmin, optimizeRoutes, refundOrder } from "@/app/admin/actions";

export function ClaimAdmin() {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      onClick={() => start(async () => { await claimAdmin(); router.refresh(); })}
      disabled={pending}
      className="btn-primary w-full"
    >
      <ShieldCheck size={18} /> {pending ? "Granting…" : "Enable admin access (demo)"}
    </button>
  );
}

export function OptimizeButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const router = useRouter();
  return (
    <div>
      <button
        onClick={() =>
          start(async () => {
            const r = await optimizeRoutes();
            if ((r as any)?.error) setMsg((r as any).error);
            else setMsg(`Route built: ${(r as any).stops} stops · ${(r as any).miles} mi · ${(r as any).assigned ? "assigned to a shopper" : "unassigned"}`);
            router.refresh();
          })
        }
        disabled={pending}
        className="btn-primary w-full"
      >
        <Route size={18} /> {pending ? "Optimizing…" : "Optimize & batch confirmed orders"}
      </button>
      {msg && <p className="text-xs text-center text-ink-500 mt-2">{msg}</p>}
    </div>
  );
}

export function RefundButton({ orderId }: { orderId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      onClick={() => start(async () => { await refundOrder(orderId); router.refresh(); })}
      disabled={pending}
      className="chip bg-red-50 text-red-700"
    >
      <RotateCcw size={13} /> Refund
    </button>
  );
}
