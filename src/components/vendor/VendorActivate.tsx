"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { activateVendor } from "@/app/vendor/actions";

/** Single-vendor activate button. (The dashboard now uses VendorSwitcher instead.) */
export function VendorActivate({ vendorId, label }: { vendorId: string; label?: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      onClick={() => start(async () => { await activateVendor(vendorId); router.refresh(); })}
      disabled={pending}
      className="btn-primary w-full"
    >
      <Store size={18} /> {pending ? "Linking…" : label ?? "Manage this vendor"}
    </button>
  );
}
