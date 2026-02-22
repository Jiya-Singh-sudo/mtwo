export interface Housekeeping {
  hk_id: string;

  hk_name: string;
  hk_name_local_language?: string | null;

  hk_contact: string;
  hk_alternate_contact?: string | null;

  address?: string | null;

  shift: "Morning" | "Evening" | "Night" | "Full-Day";

  is_active: boolean;

  inserted_at: string;
  inserted_by?: string | null;
  inserted_ip?: string | null;

  updated_at?: string | null;
  updated_by?: string | null;
  updated_ip?: string | null;
}

export interface HousekeepingCreateDto {
  hk_name: string;

  hk_contact: string;
  hk_alternate_contact?: string;

  address?: string;

  shift: "Morning" | "Evening" | "Night" | "Full-Day";
}

export interface HousekeepingUpdateDto {
  hk_name?: string;

  hk_contact?: string;
  hk_alternate_contact?: string;

  address?: string;

  shift?: "Morning" | "Evening" | "Night" | "Full-Day";

  is_active?: boolean;
}
