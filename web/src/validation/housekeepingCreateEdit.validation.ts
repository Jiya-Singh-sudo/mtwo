import { z } from "zod";

/* ================= CONSTANTS ================= */

const NAME_REGEX = /^[A-Za-z .]*$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const TEXT_REGEX = /^[A-Za-z0-9 .,/()-]*$/;

const SHIFT_ENUM = ["Morning", "Evening", "Night", "Full-Day"] as const;

/* ================= SCHEMA ================= */

export const housekeepingCreateSchema = z.object({
  hk_name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .regex(NAME_REGEX, "Only letters allowed"),

  hk_name_local_language: z
    .string()
    .max(100, "Local name too long")
    .optional()
    .or(z.literal("")),

  hk_contact: z
    .string()
    .regex(MOBILE_REGEX, "Enter valid 10 digit mobile number"),

  hk_alternate_contact: z
    .string()
    .regex(MOBILE_REGEX, "Enter valid alternate mobile number")
    .optional()
    .or(z.literal("")),

  address: z
    .string()
    .max(250, "Address too long")
    .regex(TEXT_REGEX, "Invalid characters")
    .optional()
    .or(z.literal("")),

  shift: z.enum(SHIFT_ENUM),
});

export type HousekeepingCreateSchema = z.infer<typeof housekeepingCreateSchema>;
