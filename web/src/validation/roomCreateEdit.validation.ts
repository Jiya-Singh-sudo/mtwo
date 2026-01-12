import { z } from "zod";

/* ================= CONSTANTS ================= */

const ROOM_NO_REGEX = /^[A-Za-z0-9\-\/]+$/;
const TEXT_REGEX = /^[A-Za-z0-9 .,/()-]*$/;

const MAX_TEXT = 100;

/* ================= SCHEMA ================= */

export const roomCreateEditSchema = z.object({
  room_no: z
    .string()
    .min(1, "Room number is required")
    .max(20, "Room number too long")
    .regex(ROOM_NO_REGEX, "Invalid room number format"),

  room_name: z
    .string()
    .max(MAX_TEXT, "Room name too long")
    .regex(TEXT_REGEX, "Invalid characters")
    .optional()
    .or(z.literal("")),

  building_name: z
    .string()
    .max(MAX_TEXT, "Building name too long")
    .regex(TEXT_REGEX, "Invalid characters")
    .optional()
    .or(z.literal("")),

  residence_type: z
    .string()
    .max(MAX_TEXT, "Residence type too long")
    .regex(TEXT_REGEX, "Invalid characters")
    .optional()
    .or(z.literal("")),

  room_type: z
    .string()
    .max(MAX_TEXT, "Room type too long")
    .regex(TEXT_REGEX, "Invalid characters")
    .optional()
    .or(z.literal("")),

  room_category: z
    .string()
    .max(MAX_TEXT, "Room category too long")
    .regex(TEXT_REGEX, "Invalid characters")
    .optional()
    .or(z.literal("")),

  room_capacity: z
    .number()
    .int("Capacity must be a whole number")
    .min(1, "Capacity must be at least 1")
    .max(20, "Capacity too high"),

  status: z.enum(["Available", "Occupied"]),
});

export type RoomCreateEditSchema = z.infer<typeof roomCreateEditSchema>;
