"use client";

import { useTransition } from "react";
import { Store } from "lucide-react";
import { activateVendor } from "@/app/vendor/actions";

export function VendorActivate() {
  const [pending, start] = useTransition();
  return (
    <button onClick={() => start(() => void activateVendor())} disabled={pending} className="btn-primary w-full">
      <Store size={18} /> {pending ? "Linking…" : "Manage AquaPure Springs (demo)"}
    </button>
  );
}
