// src/validation/guestDriver.validation.ts
import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;        // YYYY-MM-DD
const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;    // HH:MM or HH:MM:SS

export const guestDriverSchema = z.object({
  guest_id: z.string().min(1, "guest_id is required"),
  driver_id: z.string().min(1, "driver_id is required"),
  vehicle_no: z.string().optional(),
  room_id: z.string().optional(),

  from_location: z.string().optional(),
  to_location: z.string().optional(),

  pickup_location: z.string().min(1, "pickup_location is required"),
  drop_location: z.string().optional(),

  trip_date: z.string().regex(dateRegex, "trip_date must be YYYY-MM-DD"),
  start_time: z.string().regex(timeRegex, "start_time must be HH:MM or HH:MM:SS"),
  end_time: z.string().regex(timeRegex, "end_time must be HH:MM or HH:MM:SS").optional(),

  drop_date: z.string().regex(dateRegex, "drop_date must be YYYY-MM-DD").optional(),
  drop_time: z.string().regex(timeRegex, "drop_time must be HH:MM or HH:MM:SS").optional(),

  pickup_status: z.enum(["Waiting", "Success"]).optional(),
  drop_status: z.enum(["Waiting", "Success"]).optional(),
  trip_status: z.enum(["Scheduled", "Ongoing", "Completed", "Cancelled"]).optional(),

  remarks: z.string().optional()
});

export const guestDriverUpdateSchema = guestDriverSchema.partial().extend({
  is_active: z.boolean().optional()
});
