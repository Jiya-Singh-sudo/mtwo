export class CreateGuestDto {
  guest_name!: string;
  guest_name_local_language?: string;
  guest_mobile!: string;
  guest_alternate_mobile?: string;
  guest_address?: string;
  id_proof_type!: 'Aadhaar'|'PAN'|'Passport'|'Driving-License'|'Voter-ID'|'Other'; // must match enum values
  id_proof_no?: string;
  email?: string;
}
