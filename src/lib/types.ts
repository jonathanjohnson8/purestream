// Domain types for PureStream. Mirrors the Supabase schema (see docs/architecture.md).

export type AppRole =
  | "consumer"
  | "business_owner"
  | "business_manager"
  | "business_member"
  | "shopper"
  | "vendor_owner"
  | "vendor_staff"
  | "admin"
  | "support";

export type OrderStatus =
  | "draft"
  | "placed"
  | "payment_authorized"
  | "vendor_pending"
  | "vendor_confirmed"
  | "shopper_assigned"
  | "shopping"
  | "substitution_pending"
  | "ready_for_pickup"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "canceled"
  | "refunded"
  | "failed";

export type AvailabilityStatus = "available" | "low" | "unavailable";
export type FulfillmentType = "platform_shopper" | "vendor_driver" | "third_party_logistics";

export interface Vendor {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  status: string;
  commission_rate: number;
  support_email: string | null;
  support_phone: string | null;
}

export interface VendorLocation {
  id: string;
  vendor_id: string;
  name: string;
  address_id: string | null;
  timezone: string;
  status: string;
}

export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  unit_size: string | null;
  weight_lbs: number;
  deposit_amount: number;
  price: number;
  status: string;
}

export interface ProductWithAvailability extends Product {
  availability_status?: AvailabilityStatus;
}

export interface Address {
  id: string;
  owner_type: string;
  owner_id: string;
  label: string | null;
  street: string;
  city: string;
  state: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  delivery_instructions: string | null;
  stairs_count: number | null;
  has_elevator: boolean | null;
  has_loading_dock: boolean | null;
  parking_notes: string | null;
}

export interface Order {
  id: string;
  order_number: number;
  customer_user_id: string | null;
  business_id: string | null;
  vendor_id: string;
  vendor_location_id: string | null;
  delivery_address_id: string | null;
  fulfillment_type: FulfillmentType;
  status: OrderStatus;
  scheduled_window_start: string | null;
  scheduled_window_end: string | null;
  is_on_demand: boolean;
  subtotal: number;
  delivery_fee: number;
  service_fee: number;
  deposit_total: number;
  discount_total: number;
  tax_total: number;
  credits_applied: number;
  total: number;
  payment_status: string;
  notes: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  quantity: number;
  unit_price: number;
  deposit_amount: number;
  weight_lbs: number;
  status: string;
  substitution_allowed: boolean;
}

export interface Substitution {
  id: string;
  order_id: string;
  original_order_item_id: string;
  suggested_product_id: string | null;
  suggested_name_snapshot: string | null;
  suggested_price: number | null;
  suggested_quantity: number | null;
  photo_url: string | null;
  customer_decision: "pending" | "approved" | "rejected" | "expired" | "auto_skipped";
  expires_at: string | null;
  status: "pending" | "resolved" | "expired";
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  draft: "Draft",
  placed: "Placed",
  payment_authorized: "Payment authorized",
  vendor_pending: "Awaiting vendor",
  vendor_confirmed: "Vendor confirmed",
  shopper_assigned: "Shopper assigned",
  shopping: "Shopping",
  substitution_pending: "Substitution needed",
  ready_for_pickup: "Ready for pickup",
  picked_up: "Picked up",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  completed: "Completed",
  canceled: "Canceled",
  refunded: "Refunded",
  failed: "Failed",
};

// Progress ordering for the customer tracker.
export const ORDER_PROGRESS: OrderStatus[] = [
  "placed",
  "vendor_confirmed",
  "shopper_assigned",
  "shopping",
  "picked_up",
  "out_for_delivery",
  "delivered",
];
