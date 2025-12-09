import { z } from "zod";

export const housekeepingSchema = z.object({
  hk_name: z.string().min(2, "Name is required"),
  hk_name_local_language: z.string().optional(),

  hk_contact: z.string()
    .length(10, "Contact must be exactly 10 digits")
    .regex(/^[0-9]{10}$/, "Invalid mobile number"),

  hk_alternate_contact: z.string()
    .length(10)
    .regex(/^[0-9]{10}$/)
    .optional(),

  address: z.string().optional(),

  shift: z.enum(["Morning", "Evening", "Night", "Full-Day"])
});

export const housekeepingUpdateSchema = housekeepingSchema.partial().extend({
  is_active: z.boolean().optional()
});
