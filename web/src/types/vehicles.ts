export interface Vehicle {
  vehicle_no: string;
  vehicle_name: string;
  model?: string | null;
  manufacturing?: string | null;
  capacity?: number | null;
  color?: string | null;

  is_active: boolean;

  inserted_at: string;
  inserted_by: string | null; 
  inserted_ip: string | null;

  updated_at?: string | null;
  updated_by?: string | null;
  updated_ip?: string | null;
  
}

export interface VehicleCreateDto {
  vehicle_no: string;
  vehicle_name: string;
  model?: string;
  manufacturing?: string;
  capacity?: number;
  color?: string;
}

export interface VehicleUpdateDto {
  vehicle_name?: string;
  model?: string;
  manufacturing?: string;
  capacity?: number;
  color?: string;
  is_active?: boolean;
}
