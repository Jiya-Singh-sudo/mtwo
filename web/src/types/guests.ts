export type InoutStatus = 'Entered' | 'Inside' | 'Exited';

export interface ActiveGuestRow {
  guest_id: number;
  guest_name: string;
  guest_name_local_language?: string | null;
  guest_mobile?: string | null;
  guest_alternate_mobile?: string | null;
  guest_address?: string | null;
  id_proof_type?: string | null;
  id_proof_no?: string | null;
  email?: string | null;

  gd_id?: string | null;
  designation_id?: string | null;
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
  room_id?: string | null;
}
