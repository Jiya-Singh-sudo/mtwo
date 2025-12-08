export class UpdateRoomDto {
  room_no?: string;
  room_name?: string;
  building_name?: string;
  residence_type?: string;

  room_type?: string;
  room_capacity?: number;
  room_category?: string;

  status?: 'Available' | 'Occupied';
  is_active?: boolean;
}
