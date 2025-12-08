export class CreateGuestDto {
  guest_name: string;
  guest_name_local?: string;

  guest_mobile: string;
  guest_alternate_mobile?: string;

  guest_address?: string;

  id_proof_type?: string;
  id_proof_no?: string;

  email?: string;
}
