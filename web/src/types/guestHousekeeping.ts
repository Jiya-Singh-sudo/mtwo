export interface GuestHousekeeping {
  guest_hk_id: string;

  hk_id: string;
  guest_id: string;

  task_date: string; // YYYY-MM-DD
  task_shift: "Morning" | "Evening" | "Night" | "Full-Day";

  service_type: string;
  admin_instructions?: string | null;

  status: "Scheduled" | "In-Progress" | "Completed" | "Cancelled";

  assigned_by?: string | null;
  assigned_at: string;          // timestamp
  completed_at?: string | null;

  is_active: boolean;
}

export interface GuestHousekeepingCreateDto {
  hk_id: string;
  guest_id: string;

  task_date: string;
  task_shift: "Morning" | "Evening" | "Night" | "Full-Day";

  service_type: string;
  admin_instructions?: string;
}

export interface GuestHousekeepingUpdateDto {
  hk_id?: string;
  guest_id?: string;

  task_date?: string;
  task_shift?: "Morning" | "Evening" | "Night" | "Full-Day";

  service_type?: string;
  admin_instructions?: string;

  status?: "Scheduled" | "In-Progress" | "Completed" | "Cancelled";
  completed_at?: string;

  is_active?: boolean;
}
