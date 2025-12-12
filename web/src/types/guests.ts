// src/types/guest.ts

export type Guest = {
  guest_id: string;
  guest_name: string;
  guest_name_local_language?: string | null;
  guest_mobile?: string | null;
  guest_alternate_mobile?: string | null;
  guest_address?: string | null;
  id_proof_type?: string | null;
  id_proof_no?: string | null;
  email?: string | null;
  is_active?: boolean;
  inserted_at?: string | null;
  inserted_by?: string | null;
  inserted_ip?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
  updated_ip?: string | null;
};

export type GuestCreateDto = Partial<Guest> & { guest_name: string };
export type GuestUpdateDto = Partial<Guest>;
