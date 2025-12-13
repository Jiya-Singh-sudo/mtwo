export class UpdateGuestRoomDto {
  room_id?: string;

  check_in_date?: string;
  check_in_time?: string;

  check_out_date?: string;
  check_out_time?: string;

  action_type?: 
    | "Room-Allocated"
    | "Room-Changed"
    | "Room-Upgraded"
    | "Room-Downgraded"
    | "Extra-Bed-Added"
    | "Room-Shifted"
    | "Room-Released"
    | "Other";

  status?: 'Available' | 'Occupied';

  action_description?: string;

  action_date?: string;
  action_time?: string;

  remarks?: string;

  is_active?: boolean;
}
