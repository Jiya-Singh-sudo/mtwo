export interface Designation {
  designation_id: string;
  designation_name: string;
  designation_name_local_language?: string | null;

  is_active: boolean;
  inserted_at: string;
  inserted_by?: string | null;
  insertes_ip?: string | null;

  updated_at?: string | null;
  updated_by?: string | null;
  updated_ip?: string | null;
}

export interface DesignationCreateDto {
  designation_name: string;
  designation_name_local_language?: string;
}

export interface DesignationUpdateDto {
  designation_name?: string;
  designation_name_local_language?: string;
  is_active?: boolean;
}
