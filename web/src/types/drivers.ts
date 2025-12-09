export interface Driver {
  driver_id: string;
  driver_name: string;
  driver_name_local?: string;
  driver_contact: string;
  driver_alternate_mobile?: string;
  driver_license: string;
  address?: string;
  is_active: boolean;
  inserted_at: string;
  inserted_by: string;
  inserted_ip: string;
  updated_at?: string;
  updated_by?: string;
  updated_ip?: string;
}

export interface CreateDriverDto {
  driver_name: string;
  driver_name_local?: string;
  driver_contact: string;
  driver_alternate_mobile?: string;
  driver_license: string;
  address?: string;
}

export interface UpdateDriverDto {
  driver_name?: string;
  driver_name_local?: string;
  driver_contact?: string;
  driver_alternate_mobile?: string;
  driver_license?: string;
  address?: string;
  is_active?: boolean;
}
