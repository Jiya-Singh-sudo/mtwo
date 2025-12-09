export class CreateGuestButlerDto {
  guest_id: string;
  butler_id: string;
  room_id?: string;

  check_in_date?: string; // YYYY-MM-DD
  check_in_time?: string; // HH:mm
  check_out_date?: string;
  check_out_time?: string;

  service_type: 
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

  service_date?: string; // defaults to backend CURRENT_DATE
  service_time?: string; // defaults to backend CURRENT_TIME

  remarks?: string;
}
