export interface GuestInOut {
  inout_id: string;

  guest_id: string;
  room_id?: string | null;

  guest_inout?: boolean | null;

  entry_date: string; // YYYY-MM-DD
  entry_time: string; // HH:MM or HH:MM:SS

  exit_date?: string | null;
  exit_time?: string | null;

  status: "Entered" | "Inside" | "Exited";

  purpose?: string | null;
  remarks?: string | null;

  is_active: boolean;

  inserted_at: string;
  inserted_by?: string | null;
  inserted_ip?: string | null;

  updated_at?: string | null;
  updated_by?: string | null;
  updated_ip?: string | null;
}

export interface GuestInOutCreateDto {
  guest_id: string;
  room_id?: string;

  guest_inout?: boolean;

  entry_date: string;
  entry_time: string;

  exit_date?: string;
  exit_time?: string;

  status?: "Entered" | "Inside" | "Exited";

  purpose?: string;
  remarks?: string;
}

export interface GuestInOutUpdateDto {
  room_id?: string;

  guest_inout?: boolean;

  entry_date?: string;
  entry_time?: string;

  exit_date?: string;
  exit_time?: string;

  status?: "Entered" | "Inside" | "Exited";

  purpose?: string;
  remarks?: string;

  is_active?: boolean;
}
