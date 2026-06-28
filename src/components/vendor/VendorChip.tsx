"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Store, ChevronDown, Check } from "lucide-react";
import { switchVendor } from "@/app/vendor/actions";

interface VendorOpt {
  id: string;
  name: string;
}

export function VendorChip({ vendors, currentId }: { vendors: VendorOpt[]; currentId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  const current = vendors.find((v) => v.id === currentId);
  const hasOthers = vendors.length > 1;

  return (
    <div className="relative">
      <button
        onClick={() => hasOthers && setOpen((o) => !o)}
        className="chip bg-brand-50 text-brand-700 max-w-[150px]"
      >
        <Store size={13} className="shrink-0" />
        <span className="truncate">{current?.name ?? "Vendor"}</span>
        {hasOthers && <ChevronDown size={13} className="shrink-0" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 z-40 card p-1 min-w-[190px]">
            {vendors.map((v) => (
              <button
                key={v.id}
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    if (v.id !== currentId) await switchVendor(v.id);
                    setOpen(false);
                    router.refresh();
                  })
                }
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-left"
              >
                <span className="truncate">{v.name}</span>
                {v.id === currentId && <Check size={14} className="text-brand-600 shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
