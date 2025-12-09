import { z } from "zod";

export const driverSchema = z.object({
  driver_name: z.string().min(2, "Driver name is required"),
  driver_name_local: z.string().optional(),

  driver_contact: z
    .string()
    .min(10, "Contact number must be at least 10 digits")
    .max(15, "Contact number cannot exceed 15 digits"),

  driver_alternate_mobile: z.string().optional(),

  driver_license: z.string().min(3, "License number is required"),

  address: z.string().optional()
});

export const driverUpdateSchema = driverSchema.partial();
