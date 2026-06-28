"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Store, Check, Plus, ArrowLeftRight } from "lucide-react";
import { activateVendor, switchVendor } from "@/app/vendor/actions";

interface VendorOpt {
  id: string;
  name: string;
}

export function VendorSwitcher({
  vendors,
  managedIds,
  currentId,
}: {
  vendors: VendorOpt[];
  managedIds: string[];
  currentId: string | null;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <section className="card p-4">
      <h2 className="font-semibold text-ink-900 flex items-center gap-2 mb-1">
        <Store size={18} className="text-brand-600" /> Vendors
      </h2>
      <p className="text-xs text-ink-400 mb-3">Claim a vendor to manage it, or switch between the ones you run.</p>
      <div className="divide-y divide-gray-50">
        {vendors.map((v) => {
          const managed = managedIds.includes(v.id);
          const active = v.id === currentId;
          return (
            <div key={v.id} className="flex items-center gap-3 py-3">
              <span className="grid place-items-center w-9 h-9 rounded-lg bg-brand-50 text-brand-600">
                <Store size={18} />
              </span>
              <span className="flex-1 text-sm font-medium text-ink-900">{v.name}</span>
              {active ? (
                <span className="chip bg-brand-100 text-brand-800">
                  <Check size={13} /> Managing
                </span>
              ) : managed ? (
                <button
                  disabled={pending}
                  onClick={() => start(async () => { await switchVendor(v.id); router.refresh(); })}
                  className="chip bg-brand-50 text-brand-700"
                >
                  <ArrowLeftRight size={13} /> Switch
                </button>
              ) : (
                <button
                  disabled={pending}
                  onClick={() => start(async () => { await activateVendor(v.id); router.refresh(); })}
                  className="chip bg-gray-100 text-ink-700"
                >
                  <Plus size={13} /> Manage
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
