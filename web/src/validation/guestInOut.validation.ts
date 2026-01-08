import { z } from "zod";

const dateRegex = /^\d{2}-\d{2}-\d{`2}$/;
const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;

export const guestInOutSchema = z
  .object({
    guest_id: z.string().optional(), // frontend can omit

    room_id: z.string().optional(),

    guest_inout: z.boolean().optional(),

    entry_date: z
      .string()
      .regex(dateRegex, "Check-in date must be DD-MM-YYYY"),

    entry_time: z
      .string()
      .regex(timeRegex, "Check-in time must be HH:MM or HH:MM:SS"),

    exit_date: z
      .string()
      .regex(dateRegex, "Check-out date must be DD-MM-YYYY")
      .optional(),

    exit_time: z
      .string()
      .regex(timeRegex, "Check-out time must be HH:MM or HH:MM:SS")
      .optional(),

    status: z.enum(["Entered", "Inside", "Exited"]).optional(),

    purpose: z.string().optional(),
    remarks: z.string().optional(),
  })
  .refine(
    (data) => {
      // If exit_date is present, exit_time must be present
      if (data.exit_date && !data.exit_time) return false;
      return true;
    },
    {
      message: "Exit time is required when exit date is provided",
      path: ["exit_time"],
    }
  );

export const guestInOutUpdateSchema = guestInOutSchema.partial().extend({
  is_active: z.boolean().optional(),
});
