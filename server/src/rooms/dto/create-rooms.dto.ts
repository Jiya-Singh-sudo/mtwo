export class CreateRoomDto {
  room_no: string;
  room_name?: string;
  building_name?: string;
  residence_type?: string;

  room_type?: string;        // Single / Double / Family
  room_capacity?: number;
  room_category?: string;    // AC / Non-AC / Deluxe

  status: 'Available' | 'Occupied';
}
