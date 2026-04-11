import { z } from "zod";

/* ================= CONSTANTS ================= */

const NAME_REGEX = /^[A-Za-z .]*$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
// const TEXT_REGEX = /^[A-Za-z0-9 .,/()-]*$/;

/* ================= CREATE SCHEMA ================= */

export const medicalEmergencyCreateSchema = z
  .object({
    service_provider_name: z
      .string()
      .min(1, "Service provider name is required")
      .max(100, "Name too long")
      .regex(NAME_REGEX, "Only letters allowed"),

    service_provider_name_local_language: z
      .string()
      .max(100, "Local name too long")
      .optional()
      .or(z.literal("")),

    service_type: z
      .string()
      .min(1, "Service type is required")
      .max(50, "Service type too long"),

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
    //   .email("Invalid email address")
    //   .optional()
    //   .or(z.literal("")),

    // address_line: z
    //   .string()
    //   .max(250, "Address too long")
    //   .regex(TEXT_REGEX, "Invalid characters")
    //   .optional()
    //   .or(z.literal("")),

    distance_from_guest_house: z
      .string()
      .max(50, "Distance too long")
      .regex(/^[0-9 .kmKM]*$/, "Invalid distance format")
      .optional()
      .or(z.literal("")),

    is_active: z.boolean().optional(),
  })

  /* ================= CROSS FIELD RULES ================= */

  .superRefine((data, ctx) => {
    const { mobile, alternate_mobile } = data;

    // ❗ alternate mobile should not match primary
    if (
      alternate_mobile &&
      alternate_mobile !== "" &&
      alternate_mobile === mobile
    ) {
      ctx.addIssue({
        path: ["alternate_mobile"],
        message: "Alternate number must be different",
        code: z.ZodIssueCode.custom,
      });
    }
  });

/* ================= UPDATE SCHEMA ================= */

export const medicalEmergencyUpdateSchema =
  medicalEmergencyCreateSchema.partial();

/* ================= TYPES ================= */

export type MedicalEmergencyCreateSchema = z.infer<
  typeof medicalEmergencyCreateSchema
>;

export type MedicalEmergencyUpdateSchema = z.infer<
  typeof medicalEmergencyUpdateSchema
>;