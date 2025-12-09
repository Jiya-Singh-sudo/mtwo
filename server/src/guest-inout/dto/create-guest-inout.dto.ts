export class CreateGuestInoutDto {
  guest_id: string;
  room_id?: string;

  guest_inout?: boolean;

  entry_date: string; // YYYY-MM-DD
  entry_time: string; // HH:mm

  exit_date?: string;
  exit_time?: string;

  status?: "Entered" | "Inside" | "Exited";
  purpose?: string;
  remarks?: string;
}
