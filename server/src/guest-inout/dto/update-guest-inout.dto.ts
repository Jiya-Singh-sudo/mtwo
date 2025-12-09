export class UpdateGuestInoutDto {
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
