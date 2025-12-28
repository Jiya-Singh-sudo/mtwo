export class UpdateGuestVehicleDto {
  guest_id: string;
  driver_id: string;
  vehicle_no: string;
  location?: string;
  assigned_at?: string;
  released_at?: string;
}
