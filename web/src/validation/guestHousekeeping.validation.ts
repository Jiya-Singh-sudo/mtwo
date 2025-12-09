import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const guestHousekeepingSchema = z.object({
  hk_id: z.string().min(1, "Housekeeping staff is required"),
  guest_id: z.string().min(1, "Guest is required"),

  task_date: z.string().regex(dateRegex, "task_date must be YYYY-MM-DD"),
  task_shift: z.enum(["Morning", "Evening", "Night", "Full-Day"]),

  service_type: z.string().min(1, "Service type is required"),
  admin_instructions: z.string().optional(),

  status: z
    .enum(["Scheduled", "In-Progress", "Completed", "Cancelled"])
    .optional(),
});

export const guestHousekeepingUpdateSchema = guestHousekeepingSchema.partial().extend({
  is_active: z.boolean().optional(),
  completed_at: z.string().optional(),
});
