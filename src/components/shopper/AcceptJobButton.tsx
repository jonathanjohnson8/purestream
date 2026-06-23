"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { acceptJob } from "@/app/shopper/actions";

export function AcceptJobButton({ orderId }: { orderId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      onClick={() =>
        start(async () => {
          await acceptJob(orderId);
          router.push(`/shopper/orders/${orderId}`);
        })
      }
      disabled={pending}
      className="btn-primary w-full !py-2"
    >
      <Check size={16} /> {pending ? "Accepting…" : "Accept job"}
    </button>
  );
}
