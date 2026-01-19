export interface GuestButler {
  guest_butler_id: string;

  guest_id: string;
  butler_id: string;

  room_id?: string | null;

  // check_in_date?: string | null;
  // check_in_time?: string | null;

  // check_out_date?: string | null;
  // check_out_time?: string | null;

  // service_type: string;
  // service_description?: string | null;

  // service_date: string;
  // service_time: string;

  specialRequest?: string | null;

  is_active: boolean;

  inserted_at: string;
  inserted_by?: string | null;
  inserted_ip?: string | null;

  updated_at?: string | null;
  updated_by?: string | null;
  updated_ip?: string | null;
}

export interface GuestButlerCreateDto {
  guest_id: string;
  butler_id: string;
  room_id?: string;

  // check_in_date?: string;
  // check_in_time?: string;

  // check_out_date?: string;
  // check_out_time?: string;

  // service_type: string;
  // service_description?: string;

  // service_date?: string;
  // service_time?: string;

  specialRequest?: string;
}

export interface GuestButlerUpdateDto {
  room_id?: string;

  // check_in_date?: string;
  // check_in_time?: string;

  // check_out_date?: string;
  // check_out_time?: string;

  // service_type?: string;
  // service_description?: string;

  // service_date?: string;
  // service_time?: string;

  specialRequest?: string;
  is_active?: boolean;
}
