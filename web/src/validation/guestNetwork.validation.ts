import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;

export const guestNetworkSchema = z.object({
  guest_id: z.string().min(1, "guest_id is required"),
  provider_id: z.string().min(1, "provider_id is required"),
  room_id: z.string().optional(),

  network_zone_from: z.string().optional(),
  network_zone_to: z.string().optional(),

  start_date: z.string().regex(dateRegex, "start_date must be YYYY-MM-DD"),
  start_time: z.string().regex(timeRegex, "start_time must be HH:MM or HH:MM:SS"),

  end_date: z.string().regex(dateRegex).optional(),
  end_time: z.string().regex(timeRegex).optional(),

  start_status: z.enum(["Waiting", "Success"]).optional(),
  end_status: z.enum(["Waiting", "Success"]).optional(),

  network_status: z.enum([
    "Requested",
    "Connected",
    "Disconnected",
    "Issue-Reported",
    "Resolved",
    "Cancelled"
  ]).optional(),

  description: z.string().optional(),
  remarks: z.string().optional()
});

export const guestNetworkUpdateSchema = guestNetworkSchema.partial().extend({
  is_active: z.boolean().optional()
});
