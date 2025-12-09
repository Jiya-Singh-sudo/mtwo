export class UpdateGuestHousekeepingDto {
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
