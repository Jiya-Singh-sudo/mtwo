export class UpdateGuestInoutDto {
  entry_date?: string;
  entry_time?: string;
  exit_date?: string;
  exit_time?: string;
  status?: 'Entered'|'Inside'|'Exited';
  remarks?: string;
  purpose?: string;
  room_id?: string;
}
