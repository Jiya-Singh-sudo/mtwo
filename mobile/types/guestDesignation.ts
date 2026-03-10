export interface GuestDesignation {
  gd_id: string;

  guest_id: string;
  designation_id: string;
  designation_name: string;

  department?: string | null;
  organization?: string | null;
  office_location?: string | null;

  is_current: boolean;
  is_active: boolean;

  inserted_at: string;
  inserted_by?: string | null;
  inserted_ip?: string | null;

  updated_at?: string | null;
  updated_by?: string | null;
  updated_ip?: string | null;
}

export interface GuestDesignationCreateDto {
  guest_id: string;
  designation_id: string;
  designation_name: string;

  department?: string;
  organization?: string;
  office_location?: string;
}

export interface GuestDesignationUpdateDto {
  designation_id?: string;
  designation_name?: string;

  department?: string;
  organization?: string;
  office_location?: string;

  is_current?: boolean;
  is_active?: boolean;
}
