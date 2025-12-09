// src/types/guestDriver.ts

export interface GuestDriver {
  guest_driver_id: string;

  guest_id: string;
  driver_id: string;
  vehicle_no?: string | null;
  room_id?: string | null;

  from_location?: string | null;
  to_location?: string | null;

  pickup_location: string;
  drop_location?: string | null;

  trip_date: string;   // YYYY-MM-DD
  start_time: string;  // HH:MM[:SS]
  end_time?: string | null;

  drop_date?: string | null;
  drop_time?: string | null;

  pickup_status: "Waiting" | "Success";
  drop_status: "Waiting" | "Success";
  trip_status: "Scheduled" | "Ongoing" | "Completed" | "Cancelled";

  remarks?: string | null;

  is_active: boolean;

  inserted_at: string;
  inserted_by?: string | null;
  inserted_ip?: string | null;

  updated_at?: string | null;
  updated_by?: string | null;
  updated_ip?: string | null;
}

export interface GuestDriverCreateDto {
  guest_id: string;
  driver_id: string;
  vehicle_no?: string;
  room_id?: string;

  from_location?: string;
  to_location?: string;

  pickup_location: string;
  drop_location?: string;

  trip_date: string;
  start_time: string;
  end_time?: string;

  drop_date?: string;
  drop_time?: string;

  pickup_status?: "Waiting" | "Success";
  drop_status?: "Waiting" | "Success";
  trip_status?: "Scheduled" | "Ongoing" | "Completed" | "Cancelled";

  remarks?: string;
}

export interface GuestDriverUpdateDto {
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
