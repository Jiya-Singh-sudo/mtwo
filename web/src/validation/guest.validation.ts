import { z } from "zod";

export const guestSchema = z.object({
  guest_name: z
    .string()
    .min(3, "Guest name must be at least 3 characters"),

  guest_mobile: z
    .string()
    .min(10, "Mobile number must be at least 10 digits"),

  guest_name_local_language: z.string().optional(),

  guest_address: z.string().optional(),

  email: z
    .string()
    .email("Invalid email address")
    .optional(),
});

export type GuestSchema = z.infer<typeof guestSchema>;
