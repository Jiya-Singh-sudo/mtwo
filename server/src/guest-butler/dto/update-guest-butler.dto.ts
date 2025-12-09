export class UpdateGuestButlerDto {
  guest_id?: string;
  butler_id?: string;
  room_id?: string;

  check_in_date?: string;
  check_in_time?: string;
  check_out_date?: string;
  check_out_time?: string;

  service_type?: 
    | "Tea"
    | "Coffee"
    | "Snacks"
    | "Breakfast"
    | "Lunch"
    | "Dinner"
    | "Water-Service"
    | "Newspaper-Service"
    | "Luggage-Assist"
    | "Wakeup-Service"
    | "Room-Assist"
    | "Cleaning-Assist"
    | "Personal-Request"
    | "Other";

  service_description?: string;

  service_date?: string;
  service_time?: string;

  remarks?: string;

  is_active?: boolean;
}
