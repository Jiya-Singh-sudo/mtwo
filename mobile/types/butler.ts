export interface Butler {
  butler_id: string;

  butler_name: string;
  butler_name_local_language?: string | null;

  butler_mobile: number;
  butler_alternate_mobile?: number | null;
  address?: string | null;
  remarks?: string | null;

  shift: "Morning" | "Evening" | "Night" | "Full-Day";

  is_active: boolean;

  inserted_at: string;
  inserted_by?: string | null;
  inserted_ip?: string | null;

  updated_at?: string | null;
  updated_by?: string | null;
  updated_ip?: string | null;
}

export interface ButlerCreateDto {
  butler_name: string;
  butler_name_local_language?: string;

  butler_mobile: number;
  butler_alternate_mobile?: number | null;

  address?: string;
  remarks?: string;

  shift: "Morning" | "Evening" | "Night" | "Full-Day";
}

export interface ButlerUpdateDto {
  butler_name?: string;
  butler_name_local_language?: string;

  butler_mobile?: number;
  butler_alternate_mobile?: number | null;

  address?: string;
  remarks?: string;

  shift?: "Morning" | "Evening" | "Night" | "Full-Day";

  is_active?: boolean;
}
