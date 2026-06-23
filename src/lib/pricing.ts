// Pricing engine — mirrors the MVP fee formula in docs/architecture.md §6.
//
// customer_total = product_subtotal + flat_delivery_fee + service_fee
//                  + bottle_deposits + taxes - promotions - account_credits

export const SERVICE_FEE_RATE = 0.08; // 8% platform service fee
export const TAX_RATE = 0.0; // taxes out of scope for POC market
export const DEFAULT_COMMISSION_RATE = 0.15;

export interface PricingLine {
  unit_price: number;
  quantity: number;
  deposit_amount: number;
}

export interface PromoInput {
  promo_type: "percent" | "fixed" | "free_delivery";
  value: number;
}

export interface PricingResult {
  subtotal: number;
  delivery_fee: number;
  service_fee: number;
  deposit_total: number;
  discount_total: number;
  tax_total: number;
  credits_applied: number;
  total: number;
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function computePricing(opts: {
  lines: PricingLine[];
  flatDeliveryFee: number;
  promo?: PromoInput | null;
  availableCredits?: number;
}): PricingResult {
  const { lines, flatDeliveryFee, promo, availableCredits = 0 } = opts;

  const subtotal = round2(
    lines.reduce((s, l) => s + l.unit_price * l.quantity, 0)
  );
  const deposit_total = round2(
    lines.reduce((s, l) => s + l.deposit_amount * l.quantity, 0)
  );

  let delivery_fee = flatDeliveryFee;
  let discount_total = 0;

  if (promo) {
    if (promo.promo_type === "percent") {
      discount_total = round2(subtotal * (promo.value / 100));
    } else if (promo.promo_type === "fixed") {
      discount_total = round2(Math.min(promo.value, subtotal));
    } else if (promo.promo_type === "free_delivery") {
      discount_total = delivery_fee;
      delivery_fee = 0;
    }
  }

  const service_fee = round2(subtotal * SERVICE_FEE_RATE);
  const taxableBase = subtotal + delivery_fee + service_fee - discount_total;
  const tax_total = round2(Math.max(0, taxableBase) * TAX_RATE);

  const preCredit = round2(
    subtotal + delivery_fee + service_fee + deposit_total + tax_total -
      (promo?.promo_type === "free_delivery" ? 0 : discount_total)
  );

  const credits_applied = round2(Math.min(availableCredits, Math.max(0, preCredit)));
  const total = round2(Math.max(0, preCredit - credits_applied));

  return {
    subtotal,
    delivery_fee,
    service_fee,
    deposit_total,
    discount_total,
    tax_total,
    credits_applied,
    total,
  };
}

// Vendor settlement: eligible_product_subtotal - vendor_commission - vendor_adjustments
export function vendorPayout(eligibleSubtotal: number, commissionRate: number) {
  const commission = round2(eligibleSubtotal * commissionRate);
  return { commission, payout: round2(eligibleSubtotal - commission) };
}

// Shopper settlement: route_base_pay + per_stop_pay + heavy_item_adjustments - penalties
export function shopperPayout(opts: {
  stops: number;
  heavyItemLbs: number;
}) {
  const base = 6.0;
  const perStop = 3.5 * opts.stops;
  const heavy = round2(Math.max(0, opts.heavyItemLbs - 50) * 0.05);
  return { base, perStop, heavy, total: round2(base + perStop + heavy) };
}
