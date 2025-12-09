export interface GuestFood {
  guest_food_id: string;

  guest_id: string;
  room_id?: string | null;

  food_id: string;
  quantity: number;

  request_type: "Room-Service" | "Dine-In" | "Buffet" | "Takeaway" | "Other";
  delivery_status: "Requested" | "Preparing" | "Ready" | "Delivered" | "Cancelled";

  order_datetime: string;
  delivered_datetime?: string | null;

  remarks?: string | null;

  is_active: boolean;

  inserted_at: string;
  inserted_by?: string | null;
  inserted_ip?: string | null;

  updated_at?: string | null;
  updated_by?: string | null;
  updated_ip?: string | null;
}

export interface GuestFoodCreateDto {
  guest_id: string;
  room_id?: string;

  food_id: string;
  quantity?: number;

  request_type?: "Room-Service" | "Dine-In" | "Buffet" | "Takeaway" | "Other";
  delivery_status?: "Requested" | "Preparing" | "Ready" | "Delivered" | "Cancelled";

  order_datetime?: string;
  delivered_datetime?: string;

  remarks?: string;
}

export interface GuestFoodUpdateDto {
  room_id?: string;

  quantity?: number;

  request_type?: "Room-Service" | "Dine-In" | "Buffet" | "Takeaway" | "Other";
  delivery_status?: "Requested" | "Preparing" | "Ready" | "Delivered" | "Cancelled";

  delivered_datetime?: string;

  remarks?: string;

  is_active?: boolean;
}
