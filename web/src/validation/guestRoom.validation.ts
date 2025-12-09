import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;

// enum values from DB:
// 'Room-Allocated','Room-Changed','Room-Upgraded','Room-Downgraded',
// 'Extra-Bed-Added','Room-Shifted','Room-Released','Other'

export const guestRoomSchema = z.object({
  guest_id: z.string().min(1, "guest_id is required"),
  room_id: z.string().optional(),

  check_in_date: z.string().regex(dateRegex).optional(),
  check_in_time: z.string().regex(timeRegex).optional(),

  check_out_date: z.string().regex(dateRegex).optional(),
  check_out_time: z.string().regex(timeRegex).optional(),

  action_type: z.enum([
    "Room-Allocated",
    "Room-Changed",
    "Room-Upgraded",
    "Room-Downgraded",
    "Extra-Bed-Added",
    "Room-Shifted",
    "Room-Released",
    "Other"
  ]),

  action_description: z.string().optional(),

  action_date: z.string().regex(dateRegex).optional(),
  action_time: z.string().regex(timeRegex).optional(),

  remarks: z.string().optional()
});

export const guestRoomUpdateSchema = guestRoomSchema.partial().extend({
  is_active: z.boolean().optional()
});
