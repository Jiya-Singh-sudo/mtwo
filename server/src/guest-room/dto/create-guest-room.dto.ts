export class CreateGuestRoomDto {
  guest_id: string;
  room_id?: string;

  check_in_date?: string; // YYYY-MM-DD
  check_in_time?: string; // HH:mm

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

  // optional — DB will set defaults if omitted
  action_date?: string;
  action_time?: string;

  remarks?: string;
}
