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
