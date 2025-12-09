import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;

export const guestInOutSchema = z.object({
  guest_id: z.string().min(1, "guest_id is required"),
  room_id: z.string().optional(),

  guest_inout: z.boolean().optional(),

  entry_date: z.string().regex(dateRegex, "entry_date must be YYYY-MM-DD"),
  entry_time: z.string().regex(timeRegex, "entry_time must be HH:MM or HH:MM:SS"),

  exit_date: z.string().regex(dateRegex).optional(),
  exit_time: z.string().regex(timeRegex).optional(),

  status: z.enum(["Entered", "Inside", "Exited"]).optional(),

  purpose: z.string().optional(),
  remarks: z.string().optional()
});

export const guestInOutUpdateSchema = guestInOutSchema.partial().extend({
  is_active: z.boolean().optional()
});
