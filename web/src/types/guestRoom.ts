export interface GuestRoom {
  guest_room_id: string;

  guest_id: string;
  room_id?: string | null;

  check_in_date?: string | null; 
  check_in_time?: string | null;

  check_out_date?: string | null;
  check_out_time?: string | null;

  action_type:
    | "Room-Allocated"
    | "Room-Changed"
    | "Room-Upgraded"
    | "Room-Downgraded"
    | "Extra-Bed-Added"
    | "Room-Shifted"
    | "Room-Released"
    | "Other";

  action_description?: string | null;

  action_date: string;
  action_time: string;

  remarks?: string | null;

  is_active: boolean;

  inserted_at: string;
  inserted_by?: string | null;
  inserted_ip?: string | null;

  updated_at?: string | null;
  updated_by?: string | null;
  updated_ip?: string | null;
}

export interface GuestRoomCreateDto {
  guest_id: string;
  room_id?: string;

  check_in_date?: string;
  check_in_time?: string;

  check_out_date?: string;
  check_out_time?: string;

  action_type:
    | "Room-Allocated"
    | "Room-Changed"
    | "Room-Upgraded"
    | "Room-Downgraded"
    | "Extra-Bed-Added"
    | "Room-Shifted"
    | "Room-Released"
    | "Other";

  action_description?: string;

  action_date?: string;
  action_time?: string;

  remarks?: string;
}

export interface GuestRoomUpdateDto {
  room_id?: string;

  check_in_date?: string;
  check_in_time?: string;

  check_out_date?: string;
  check_out_time?: string;

  action_type?: GuestRoom["action_type"];
  action_description?: string;

  action_date?: string;
  action_time?: string;

  remarks?: string;

  is_active?: boolean;
}

export type RoomOverview = {
  roomId: number;
  roomNo: string;
  roomName?: string;
  residenceType?: string;
  capacity?: number;
  status: 'Available' | 'Occupied' | string;

  guestRoomId?: string | null;
  checkInDate?: string | null;
  checkOutDate?: string | null;

  guest?: {
    guestId: number;
    guestName: string;
  } | null;
};
