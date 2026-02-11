export type InoutStatus = 'Entered' | 'Inside' | 'Exited' | 'Cancelled' | 'Scheduled';

export interface ActiveGuestRow {
  guest_id: string;
  guest_name: string;
  guest_name_local_language?: string | null;
  guest_mobile?: string | null;
  guest_alternate_mobile?: string | null;
  guest_address?: string | null;
  email?: string | null;
  requires_driver?: boolean | null;

  gd_id?: string | null;
  designation_id?: string;
  designation_name?: string | null;
  department?: string | null;
  organization?: string | null;
  office_location?: string | null;
  designation_is_current?: boolean | null;

  inout_id: string;
  entry_date?: string | null;
  entry_time?: string | null;
  exit_date?: string | null;
  exit_time?: string | null;
  inout_status?: InoutStatus | string | null;
  purpose?: string | null;
  room_id?: string | null;
}
