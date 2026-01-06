export class CreateGuestHousekeepingDto {
  hk_id: string;        // Staff ID
  room_id: string;     // Guest receiving service

  task_date: string;    // YYYY-MM-DD
  task_shift: "Morning" | "Evening" | "Night" | "Full-Day";

  service_type: string;  
  admin_instructions?: string;
  
  // status defaults in DB
}
