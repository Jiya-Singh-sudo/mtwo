import { z } from "zod";

export const roomSchema = z.object({
  room_no: z.string().min(1, "Room number is required"),
  room_name: z.string().optional(),
  building_name: z.string().optional(),
  residence_type: z.string().optional(),

  room_type: z.string().optional(),        // Single / Double / Family
  room_capacity: z.number().int().positive().optional(),

  room_category: z.string().optional(),    // AC / Non-AC / Deluxe

  status: z.enum(["Available", "Occupied"]),
});

export const roomUpdateSchema = roomSchema.partial().extend({
  is_active: z.boolean().optional(),
});
