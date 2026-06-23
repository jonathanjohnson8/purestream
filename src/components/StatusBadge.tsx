import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";

const TONE: Record<string, string> = {
  placed: "bg-blue-50 text-blue-700",
  payment_authorized: "bg-blue-50 text-blue-700",
  vendor_pending: "bg-amber-50 text-amber-700",
  vendor_confirmed: "bg-amber-50 text-amber-700",
  shopper_assigned: "bg-indigo-50 text-indigo-700",
  shopping: "bg-indigo-50 text-indigo-700",
  substitution_pending: "bg-orange-50 text-orange-700",
  ready_for_pickup: "bg-indigo-50 text-indigo-700",
  picked_up: "bg-violet-50 text-violet-700",
  out_for_delivery: "bg-brand-50 text-brand-700",
  delivered: "bg-brand-100 text-brand-800",
  completed: "bg-brand-100 text-brand-800",
  canceled: "bg-gray-100 text-gray-600",
  refunded: "bg-gray-100 text-gray-600",
  failed: "bg-red-50 text-red-700",
  draft: "bg-gray-100 text-gray-600",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`chip ${TONE[status] ?? "bg-gray-100 text-gray-600"}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {ORDER_STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function AvailabilityDot({ status }: { status?: string }) {
  const ok = status !== "unavailable";
  return (
    <span className={`chip ${ok ? "bg-brand-50 text-brand-700" : "bg-gray-100 text-gray-500"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-brand-500" : "bg-gray-400"}`} />
      {ok ? "Available" : "Unavailable"}
    </span>
  );
}
