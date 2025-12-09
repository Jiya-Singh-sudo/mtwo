import { z } from "zod";

export const butlerSchema = z.object({
  butler_name: z.string().min(2, "Name is required"),
  butler_name_local_language: z.string().optional(),

  mobile: z.string()
    .length(10, "Mobile must be exactly 10 digits")
    .regex(/^[0-9]{10}$/, "Invalid mobile number"),

  address: z.string().optional(),
  remarks: z.string().optional(),

  shift: z.enum(["Morning", "Evening", "Night", "Full-Day"])
});

export const butlerUpdateSchema = butlerSchema.partial().extend({
  is_active: z.boolean().optional()
});
