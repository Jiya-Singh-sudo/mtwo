import { z } from "zod";

/* ======================================================
   CONSTANTS
====================================================== */

const MAX_NAME_LENGTH = 100;
const MAX_DESIGNATION_LENGTH = 100;
const MAX_REMARKS_LENGTH = 500;

const nameRegex = /^[A-Za-z .]*$/;
const safeTextRegex = /^[A-Za-z0-9 ,./()\-]*$/;
const mobileRegex = /^[6-9]\d{9}$/; // Indian mobile standard

/* ======================================================
   CREATE / EDIT SCHEMA
====================================================== */

export const messengerSchema = z
  .object({
    messenger_name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(MAX_NAME_LENGTH, "Name too long")
      .regex(nameRegex, "Only letters, space and dot allowed"),

    messenger_name_local_language: z
      .string()
      .trim()
      .max(MAX_NAME_LENGTH, "Local name too long")
      .optional(),

    primary_mobile: z
      .string()
      .trim()
      .regex(mobileRegex, "Enter valid 10 digit mobile number"),

    secondary_mobile: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => !val || mobileRegex.test(val),
        { message: "Secondary mobile must be 10 digits" }
      ),

    email: z
      .string()
      .trim()
      .email("Invalid email address")
      .max(100, "Email too long")
      .optional(),

    designation: z
      .string()
      .trim()
      .max(MAX_DESIGNATION_LENGTH, "Designation too long")
      .regex(safeTextRegex, "Invalid characters in designation")
      .optional(),

    remarks: z
      .string()
      .trim()
      .max(MAX_REMARKS_LENGTH, "Remarks cannot exceed 500 characters")
      .regex(safeTextRegex, "Invalid characters in remarks")
      .transform((v) => v.replace(/[\r\n]+/g, " "))
      .optional(),
  })

  /* ======================================================
     CROSS-FIELD RULES
  ====================================================== */

  .superRefine((data, ctx) => {
    // Secondary mobile must not match primary
    if (
      data.secondary_mobile &&
      data.secondary_mobile === data.primary_mobile
    ) {
      ctx.addIssue({
        path: ["secondary_mobile"],
        message: "Secondary mobile must be different",
        code: z.ZodIssueCode.custom,
      });
    }
  });

/* ======================================================
   TYPES
====================================================== */

export type MessengerInput = z.infer<typeof messengerSchema>;