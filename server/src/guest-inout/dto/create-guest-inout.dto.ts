export class CreateGuestInOutDto {
  guest_id!: number | string;
  entry_date!: string;  // 'YYYY-MM-DD'
  room_id?: number | string;
  entry_time!: string;  // 'HH:MM:SS' or 'HH:MM'
  exit_date?: string;
  exit_time?: string;
  status?: 'Entered' | 'Inside' | 'Exited';
  purpose?: string;
  remarks?: string;
}
