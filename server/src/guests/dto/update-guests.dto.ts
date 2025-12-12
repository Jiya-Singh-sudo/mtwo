export class UpdateGuestDto {
  guest_name?: string;
  guest_name_local_language?: string;
  mobile?: string;
  alternate_mobile?: string;
  guest_address?: string;
  id_proof_type?: 'Aadhaar'|'PAN'|'Passport'|'Driving-License'|'Voter-ID'|'Other';
  id_proof_no?: string;
  email?: string;
}

