import { z } from "zod";

export const vehicleSchema = z.object({
  vehicle_no: z.string().min(1, "Vehicle number is required"),
  vehicle_name: z.string().min(2, "Vehicle name is required"),

  model: z.string().optional(),
  manufacturing: z.string().optional(),

  capacity: z.number().int().positive().optional(),

  color: z.string().optional(),
});

export const vehicleUpdateSchema = vehicleSchema.partial().extend({
  is_active: z.boolean().optional(),
});
