"use client";

import { useTransition } from "react";
import { Truck } from "lucide-react";
import { activateShopper } from "@/app/shopper/actions";

export function ActivateShopper() {
  const [pending, start] = useTransition();
  return (
    <button onClick={() => start(() => void activateShopper())} disabled={pending} className="btn-primary w-full">
      <Truck size={18} /> {pending ? "Activating…" : "Activate shopper account"}
    </button>
  );
}
