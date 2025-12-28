export class CreateGuestDriverDto {
  guest_id: string;
  driver_id: string;

  vehicle_no?: string;
  room_id?: string;

  from_location?: string;
  to_location?: string;

  pickup_location: string;
  drop_location?: string;

  trip_date: string;     // YYYY-MM-DD
  start_time: string;    // HH:mm
  end_time?: string;

  drop_date?: string;
  drop_time?: string;

  pickup_status?: "Waiting" | "Success";
  drop_status?: "Waiting" | "Success";
  trip_status?: "Scheduled" | "Ongoing" | "Completed" | "Cancelled";

  remarks?: string;
}
