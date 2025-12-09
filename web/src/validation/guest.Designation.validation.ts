import { z } from "zod";

export const guestDesignationSchema = z.object({
  guest_id: z.string().min(1, "guest_id is required"),
  designation_id: z.string().min(1, "designation_id is required"),

  department: z.string().optional(),
  organization: z.string().optional(),
  office_location: z.string().optional(),

  // is_current defaults to true in backend
});

export const guestDesignationUpdateSchema = guestDesignationSchema.partial().extend({
  is_current: z.boolean().optional(),
  is_active: z.boolean().optional()
});
