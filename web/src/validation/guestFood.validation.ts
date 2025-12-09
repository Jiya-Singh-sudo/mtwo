import { z } from "zod";

// const dateTimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/;

export const guestFoodSchema = z.object({
  guest_id: z.string().min(1, "guest_id is required"),
  room_id: z.string().optional(),
  food_id: z.string().min(1, "food_id is required"),

  quantity: z.number().int().positive().default(1),

  request_type: z.enum(["Room-Service", "Dine-In", "Buffet", "Takeaway", "Other"]).optional(),
  delivery_status: z.enum(["Requested", "Preparing", "Ready", "Delivered", "Cancelled"]).optional(),

  order_datetime: z.string().optional(),
  delivered_datetime: z.string().optional(),

  remarks: z.string().optional()
});

export const guestFoodUpdateSchema = guestFoodSchema.partial().extend({
  is_active: z.boolean().optional()
});
