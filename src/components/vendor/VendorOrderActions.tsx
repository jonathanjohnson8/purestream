"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { vendorConfirm, vendorReject } from "@/lib/orderActions";

export function VendorOrderActions({ orderId }: { orderId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="flex gap-2 mt-3">
      <button
        disabled={pending}
        onClick={() => start(async () => { await vendorConfirm(orderId); router.refresh(); })}
        className="btn-primary flex-1 !py-2"
      >
        <Check size={16} /> Confirm
      </button>
      <button
        disabled={pending}
        onClick={() => start(async () => { await vendorReject(orderId); router.refresh(); })}
        className="btn flex-1 !py-2 bg-white border border-gray-200 text-ink-700"
      >
        <X size={16} /> Reject
      </button>
    </div>
  );
}
