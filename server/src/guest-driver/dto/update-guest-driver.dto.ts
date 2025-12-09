export class UpdateGuestDriverDto {
  driver_id?: string;
  vehicle_no?: string;
  room_id?: string;

  from_location?: string;
  to_location?: string;

  pickup_location?: string;
  drop_location?: string;

  trip_date?: string;
  start_time?: string;
  end_time?: string;

  drop_date?: string;
  drop_time?: string;

  pickup_status?: "Waiting" | "Success";
  drop_status?: "Waiting" | "Success";
  trip_status?: "Scheduled" | "Ongoing" | "Completed" | "Cancelled";

  remarks?: string;

  is_active?: boolean;
}
