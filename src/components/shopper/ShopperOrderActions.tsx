"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play, PackageCheck, Truck, Navigation, Camera, Recycle, RefreshCw, Ban } from "lucide-react";
import {
  startShopping,
  markPickedUp,
  markOutForDelivery,
  reportUnavailable,
  suggestSubstitution,
  completeDelivery,
  recordBottlePickup,
} from "@/lib/orderActions";
import { pushLocation } from "@/app/shopper/actions";
import { money } from "@/lib/format";

interface Item {
  id: string;
  product_name_snapshot: string;
  quantity: number;
  unit_price: number;
  status: string;
}

export function ShopperOrderActions({
  orderId,
  status,
  items,
  destination,
}: {
  orderId: string;
  status: string;
  items: Item[];
  destination: { lat: number; lng: number } | null;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const [subFor, setSubFor] = useState<string | null>(null);
  const [driveMsg, setDriveMsg] = useState("");

  const refresh = () => router.refresh();

  async function simulateDrive() {
    if (!destination) {
      setDriveMsg("No destination coords");
      return;
    }
    const start0 = { lat: 30.2672, lng: -97.7431 };
    for (let i = 1; i <= 6; i++) {
      const t = i / 6;
      const lat = start0.lat + (destination.lat - start0.lat) * t;
      const lng = start0.lng + (destination.lng - start0.lng) * t;
      await pushLocation(lat, lng);
      setDriveMsg(`Sent location ${i}/6`);
      await new Promise((r) => setTimeout(r, 700));
    }
    setDriveMsg("Arrived at destination");
  }

  return (
    <div className="space-y-4">
      {/* Item-level actions while shopping */}
      {["shopping", "shopper_assigned", "substitution_pending"].includes(status) && (
        <section className="card p-4">
          <h2 className="font-semibold text-ink-900 mb-3">Pick items</h2>
          <ul className="space-y-3">
            {items.map((it) => (
              <li key={it.id} className="border-b border-gray-50 pb-3 last:border-0">
                <div className="flex justify-between">
                  <span className={`text-sm ${it.status === "unavailable" ? "text-orange-600" : "text-ink-800"}`}>
                    {it.quantity}× {it.product_name_snapshot}
                  </span>
                  <span className="text-sm text-ink-500">{money(it.unit_price)}</span>
                </div>
                {it.status === "pending" && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => start(async () => { await reportUnavailable(orderId, it.id); refresh(); })}
                      className="chip bg-orange-50 text-orange-700"
                    >
                      <Ban size={13} /> Unavailable
                    </button>
                    <button onClick={() => setSubFor(subFor === it.id ? null : it.id)} className="chip bg-brand-50 text-brand-700">
                      <RefreshCw size={13} /> Suggest sub
                    </button>
                  </div>
                )}
                {subFor === it.id && (
                  <form
                    action={(fd) => start(async () => { await suggestSubstitution(fd); setSubFor(null); refresh(); })}
                    className="mt-2 bg-gray-50 rounded-xl p-3 space-y-2"
                  >
                    <input type="hidden" name="orderId" value={orderId} />
                    <input type="hidden" name="orderItemId" value={it.id} />
                    <input name="suggestedName" className="input !py-2" placeholder="Substitute product name" required />
                    <div className="flex gap-2">
                      <input name="suggestedPrice" type="number" step="0.01" className="input !py-2" placeholder="Price" required />
                      <input name="suggestedQty" type="number" defaultValue={it.quantity} className="input !py-2 w-20" />
                    </div>
                    <button className="btn-primary w-full !py-2">Send to customer</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Status transitions */}
      <section className="card p-4 space-y-2">
        {status === "shopper_assigned" && (
          <Btn icon={Play} label="Start shopping" onClick={() => start(async () => { await startShopping(orderId); refresh(); })} pending={pending} />
        )}
        {status === "shopping" && (
          <Btn icon={PackageCheck} label="Mark picked up" onClick={() => start(async () => { await markPickedUp(orderId); refresh(); })} pending={pending} />
        )}
        {status === "picked_up" && (
          <Btn icon={Truck} label="Start delivery" onClick={() => start(async () => { await markOutForDelivery(orderId); refresh(); })} pending={pending} />
        )}
        {status === "substitution_pending" && (
          <p className="text-sm text-orange-600 text-center py-2">Waiting on customer to approve substitution…</p>
        )}

        {["picked_up", "out_for_delivery"].includes(status) && (
          <>
            {destination && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`}
                target="_blank"
                className="btn w-full bg-white border border-gray-200 text-ink-700 py-3"
              >
                <Navigation size={18} /> Open navigation
              </a>
            )}
            <button onClick={simulateDrive} disabled={pending} className="btn-secondary w-full">
              <Navigation size={18} /> Simulate driving (live location)
            </button>
            {driveMsg && <p className="text-xs text-center text-ink-500">{driveMsg}</p>}
          </>
        )}
      </section>

      {/* Proof of delivery */}
      {status === "out_for_delivery" && (
        <section className="card p-4">
          <h2 className="font-semibold text-ink-900 flex items-center gap-2 mb-3">
            <Camera size={18} className="text-brand-600" /> Proof of delivery
          </h2>
          <form action={(fd) => start(async () => { await completeDelivery(fd); refresh(); })} className="space-y-2">
            <input type="hidden" name="orderId" value={orderId} />
            <input type="hidden" name="lat" value={destination?.lat ?? ""} />
            <input type="hidden" name="lng" value={destination?.lng ?? ""} />
            <div className="h-28 rounded-xl bg-brand-50 grid place-items-center text-brand-500 text-sm">
              <span className="flex items-center gap-2"><Camera size={18} /> Photo captured (demo)</span>
            </div>
            <input name="signedBy" className="input" placeholder="Signed by (recipient name)" required />
            <input name="notes" className="input" placeholder="Delivery notes (optional)" />
            <button className="btn-primary w-full">Complete delivery</button>
          </form>
        </section>
      )}

      {/* Bottle pickup */}
      {["picked_up", "out_for_delivery", "delivered"].includes(status) && (
        <section className="card p-4">
          <h2 className="font-semibold text-ink-900 flex items-center gap-2 mb-2">
            <Recycle size={18} className="text-brand-600" /> Empty bottle pickup
          </h2>
          <form
            action={(fd) => start(async () => { await recordBottlePickup(orderId, Number(fd.get("count") || 0)); refresh(); })}
            className="flex gap-2"
          >
            <input name="count" type="number" min={0} defaultValue={0} className="input !py-2 flex-1" />
            <button className="btn-secondary !py-2">Record + credit</button>
          </form>
          <p className="text-xs text-ink-400 mt-1">$8.00 credit issued to the customer per returned bottle.</p>
        </section>
      )}
    </div>
  );
}

function Btn({ icon: Icon, label, onClick, pending }: { icon: any; label: string; onClick: () => void; pending: boolean }) {
  return (
    <button onClick={onClick} disabled={pending} className="btn-primary w-full">
      <Icon size={18} /> {label}
    </button>
  );
}
