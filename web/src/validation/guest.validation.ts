// src/validation/guest.validation.ts
import { z } from "zod";

export const guestSchema = z.object({
  guest_name: z.string().min(3),
  guest_mobile: z.string().min(7).optional(),
  guest_name_local_language: z.string().optional(),
  guest_address: z.string().optional(),
  id_proof_type: z.string().optional(),
  id_proof_no: z.string().optional(),
  email: z.string().email().optional(),
  // Add other fields you expect to send on create/update
});

export type GuestSchema = z.infer<typeof guestSchema>;
