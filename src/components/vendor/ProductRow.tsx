"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil } from "lucide-react";
import { setAvailability, updatePrice } from "@/app/vendor/actions";
import { money } from "@/lib/format";

export function ProductRow({
  id,
  name,
  price,
  status,
}: {
  id: string;
  name: string;
  price: number;
  status: string;
}) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(price);
  const router = useRouter();
  const available = status !== "unavailable";

  return (
    <div className="card p-4">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-ink-900 truncate">{name}</p>
          {editing ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                step="0.01"
                value={val}
                onChange={(e) => setVal(Number(e.target.value))}
                className="input !py-1 w-24"
              />
              <button
                onClick={() => start(async () => { await updatePrice(id, val); setEditing(false); router.refresh(); })}
                className="chip bg-brand-600 text-white"
              >
                <Check size={13} /> Save
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="text-sm text-ink-500 flex items-center gap-1">
              {money(price)} <Pencil size={12} />
            </button>
          )}
        </div>
        <button
          disabled={pending}
          onClick={() =>
            start(async () => {
              await setAvailability(id, available ? "unavailable" : "available");
              router.refresh();
            })
          }
          className={`chip ${available ? "bg-brand-50 text-brand-700" : "bg-gray-100 text-gray-500"}`}
        >
          <span className={`w-2 h-2 rounded-full ${available ? "bg-brand-500" : "bg-gray-400"}`} />
          {available ? "Available" : "Out of stock"}
        </button>
      </div>
    </div>
  );
}
