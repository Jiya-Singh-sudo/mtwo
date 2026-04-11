import { z } from "zod";

/* ================= CONSTANTS ================= */

const NAME_REGEX = /^[A-Za-z .]*$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const TEXT_REGEX = /^[A-Za-z0-9 .,/()-]*$/;

const MAX_NAME_LENGTH = 100;

/* ================= CREATE SCHEMA ================= */

export const liasoningOfficerCreateSchema = z.object({
  officer_id: z
    .string()
    .min(1, "Officer ID is required"),

  officer_name: z
    .string()
    .min(1, "Name is required")
    .max(MAX_NAME_LENGTH, "Name too long")
    .regex(NAME_REGEX, "Only letters allowed"),

  officer_name_local_language: z
    .string()
    .max(MAX_NAME_LENGTH, "Local name too long")
    .optional()
    .or(z.literal("")),

  mobile: z
    .string()
    .regex(MOBILE_REGEX, "Enter valid 10 digit mobile number"),

  alternate_mobile: z
    .string()
    .regex(MOBILE_REGEX, "Enter valid alternate mobile number")
    .optional()
    .or(z.literal("")),

  // email: z
  //   .string()
  //   .email("Invalid email")
  //   .optional()
  //   .or(z.literal("")),

  role_id: z
    .string()
    .min(1, "Role is required")
    .optional()
    .or(z.literal("")),

  // address: z
  //   .string()
  //   .min(1, "Address is required")
  //   .optional()
  //   .or(z.literal("")),

  department: z
    .string()
    .max(100, "Department too long")
    .regex(TEXT_REGEX, "Invalid characters")
    .optional()
    .or(z.literal("")),

  designation: z
    .string()
    .max(100, "Designation too long")
    .regex(TEXT_REGEX, "Invalid characters")
    .optional()
    .or(z.literal("")),

  is_active: z.boolean().optional(),
});

/* ================= UPDATE SCHEMA ================= */

export const liasoningOfficerUpdateSchema = liasoningOfficerCreateSchema
  .partial()
  .extend({
    is_active: z.boolean().optional(),
  });

/* ================= TYPE ================= */

export type LiasoningOfficerCreateSchema = z.infer<
  typeof liasoningOfficerCreateSchema
>;

export type LiasoningOfficerUpdateSchema = z.infer<
  typeof liasoningOfficerUpdateSchema
>;