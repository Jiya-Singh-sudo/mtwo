export interface Room {
  room_id: number;
  room_no: string;
  room_name?: string | null;
  building_name?: string | null;
  residence_type?: string | null;

  room_type?: string | null;
  room_capacity?: number | null;
  room_category?: string | null;

  status: "Available" | "Occupied";

  is_active: boolean;
  inserted_at: string;
  inserted_by: string | null;
  inserted_ip: string | null;

  updated_at?: string | null;
  updated_by?: string | null;
  updated_ip?: string | null;
}

export interface RoomCreateDto {
  room_no: string;
  room_name?: string;
  building_name?: string;
  residence_type?: string;
  room_type?: string;
  room_capacity?: number;
  room_category?: string;
  status: "Available" | "Occupied";
}

export interface RoomUpdateDto {
  room_no?: string;
  room_name?: string;
  building_name?: string;
  residence_type?: string;
  room_type?: string;
  room_capacity?: number;
  room_category?: string;
  status?: "Available" | "Occupied";
  is_active?: boolean;
}
