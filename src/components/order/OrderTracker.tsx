import { Check } from "lucide-react";
import { ORDER_PROGRESS, ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";

export function OrderTracker({ status }: { status: OrderStatus }) {
  const terminal = ["canceled", "refunded", "failed"].includes(status);
  if (terminal) {
    return (
      <div className="card p-4 text-center">
        <p className="font-semibold text-ink-900">{ORDER_STATUS_LABEL[status]}</p>
      </div>
    );
  }
  const currentIdx = Math.max(
    0,
    ORDER_PROGRESS.indexOf(status === "completed" ? "delivered" : status)
  );

  return (
    <div className="card p-4">
      <ol className="space-y-0">
        {ORDER_PROGRESS.map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const last = i === ORDER_PROGRESS.length - 1;
          return (
            <li key={s} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`grid place-items-center w-7 h-7 rounded-full text-white text-xs ${
                    done ? "bg-brand-500" : active ? "bg-brand-600 ring-4 ring-brand-100" : "bg-gray-200"
                  }`}
                >
                  {done ? <Check size={15} /> : <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
                {!last && <span className={`w-0.5 flex-1 min-h-[18px] ${done ? "bg-brand-400" : "bg-gray-200"}`} />}
              </div>
              <div className={`pb-4 ${active ? "font-semibold text-ink-900" : done ? "text-ink-700" : "text-ink-300"}`}>
                <p className="text-sm leading-7">{ORDER_STATUS_LABEL[s]}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
