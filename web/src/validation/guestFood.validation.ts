import { z } from "zod";

/* ======================================================
   CONSTANTS
====================================================== */

const MAX_REMARKS_LENGTH = 500;
const safeTextRegex = /^[A-Za-z0-9 ,./()\-]*$/;

/* ======================================================
   MAIN SCHEMA
====================================================== */

export const guestFoodSchema = z.object({
  guest_id: z.string().min(1, "Guest is required"),
  food_id: z.string().min(1, "Food item is required"),

  room_id: z.string().optional(),

  // request_type: z
  //   .enum(["Room-Service", "Dine-In", "Buffet", "Takeaway", "Other"])
  //   .optional(),

  delivery_status: z
    .enum(["Requested", "Preparing", "Ready", "Delivered", "Cancelled"])
    .optional(),

  remarks: z
    .string()
    .max(MAX_REMARKS_LENGTH, "Remarks too long")
    .regex(safeTextRegex, "Invalid characters in remarks")
    .optional(),

  is_active: z.boolean().optional(),
});

/* ======================================================
   TYPE
====================================================== */

export type GuestFoodSchema = z.infer<
  typeof guestFoodSchema
>;
