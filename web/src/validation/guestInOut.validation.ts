// guestInOut.validation.ts
import { z } from "zod";

export const guestInOutSchema = z.object({
  entry_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),

  entry_time: z
    .string()
    .regex(/^\d{2}:\d{2}:\d{2}$/, "Invalid time format (HH:mm:ss)"),

  exit_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),

  exit_time: z
    .string()
    .regex(/^\d{2}:\d{2}:\d{2}$/)
    .optional(),
});
