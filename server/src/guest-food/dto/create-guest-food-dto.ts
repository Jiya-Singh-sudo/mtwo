export class CreateGuestFoodDto {
  guest_id: string;
  room_id?: string;

  food_id: string;
  quantity: number;

  request_type?:
    | "Room-Service"
    | "Dine-In"
    | "Buffet"
    | "Takeaway"
    | "Other";

  delivery_status?:
    | "Requested"
    | "Preparing"
    | "Ready"
    | "Delivered"
    | "Cancelled";

  order_datetime?: string;
  delivered_datetime?: string;

  remarks?: string;
}
