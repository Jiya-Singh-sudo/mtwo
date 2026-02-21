export interface Driver {
  driver_id: string;
  driver_name: string;
  driver_name_ll?: string;
  driver_contact: string;
  driver_alternate_contact?: string;
  driver_license: string;
  license_expiry_date: string;
  address?: string;
  is_active: boolean;
  inserted_at: string;
  inserted_by: string;
  inserted_ip: string;
  updated_at?: string;
  updated_by?: string;
  updated_ip?: string;
}
export interface AssignableDriver {
  driver_id: string;
  driver_name: string;
  driver_contact: string;
}

export interface CreateDriverDto {
  driver_name: string;
  driver_name_ll?: string;
  driver_contact: string;
  driver_alternate_contact?: string;
  driver_license: string;
  driver_mail: string;
  address?: string;
  license_expiry_date?: string;
}

export interface UpdateDriverDto {
  driver_name?: string;
  driver_name_ll?: string;
  driver_contact?: string;
  driver_alternate_contact?: string;
  driver_license?: string;
  driver_mail?: string;
  address?: string;
  is_active?: boolean;
  license_expiry_date?: string;
}
export interface DriverDashboardRow {
  driver_id: string;
  driver_name: string;
  driver_contact: string;
  driver_license: string;
  license_expiry_date: string;
  duty_status: "Available" | "Unavailable";
  is_assigned: boolean;

  vehicle_no: string | null;
  vehicle_name: string | null;
  guest_name: string | null;
}

export interface AssignableGuestVehicle {
  guest_vehicle_id: string;
  vehicle_no: string;
  guest_name: string;
}
