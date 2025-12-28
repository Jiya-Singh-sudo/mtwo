// types/vehicle.ts
export interface Vehicle {
  number: string;              // DL-01-AB-1234
  name: string;                // Innova Crysta
  manufacturer: string;        // Toyota
  year: number;                // 2021
  capacity: number;            // 7
  status: "Available" | "On Duty";

  guestName: string | null;    // Assigned guest
  location: string | null;     // Assigned location
  roomNo: string | null;       // Guest room no

  assignedAt: string | null;   // ISO datetime
  releasedAt: string | null;   // ISO datetime
}
/* ======================
   READ — Active vehicle
   ====================== */

export interface ActiveGuestVehicle {
  guest_vehicle_id: string;
  guest_id: string;

  vehicle_no: string;
  vehicle_name: string;
  model?: string | null;

  assigned_at: string;   // ISO datetime
  released_at?: string | null;

  location?: string | null;
  assignment_active: boolean;
}

/* ======================
   WRITE — Assign vehicle
   ====================== */

export interface AssignGuestVehiclePayload {
  guest_id: string;
  vehicle_no: string;
  location?: string;
  assigned_at?: string;
  released_at?: string;
}
