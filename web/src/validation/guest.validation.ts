// src/validation/guest.validation.ts
import { z } from "zod";

export const guestSchema = z.object({
  name: z.string().min(3),
  designation: z.string().optional(),
  department: z.string().optional(),
  category: z.string(),
  status: z.string(),
  arrival: z.string(),
  departure: z.string(),
});

export type GuestInput = z.infer<typeof guestSchema>;
