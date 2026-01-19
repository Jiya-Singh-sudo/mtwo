import { z } from "zod";

/* ======================================================
   CONSTANTS (STATIC, AUDIT-SAFE)
====================================================== */

const MAX_NAME_LENGTH = 100;
const MAX_ADDRESS_LENGTH = 250;
const MAX_REMARKS_LENGTH = 500;

const nameRegex = /^[A-Za-z .]*$/;
const mobileRegex = /^[6-9]\d{9}$/;
const safeTextRegex = /^[A-Za-z0-9 ,./()\-]*$/;

/* ======================================================
   MAIN SCHEMA
====================================================== */

export const butlerManagementSchema = z
  .object({
    butler_name: z
      .string()
      .min(1, "Butler name is required")
      .max(MAX_NAME_LENGTH, "Name too long")
      .regex(nameRegex, "Only letters, space and dot allowed"),

    butler_name_local_language: z
      .string()
      .max(MAX_NAME_LENGTH, "Local name too long")
      .optional(),

    butler_mobile: z
      .string()
      .regex(mobileRegex, "Enter valid 10 digit mobile number"),

    butler_alternate_mobile: z
      .string()
      .optional()
      .refine(
        (val) => !val || mobileRegex.test(val),
        { message: "Alternate mobile must be 10 digits" }
      ),

    shift: z.enum(["Morning", "Evening", "Night", "Full-Day"]),

    address: z
      .string()
      .max(MAX_ADDRESS_LENGTH, "Address too long")
      .regex(safeTextRegex, "Invalid characters in address")
      .optional(),

    remarks: z
      .string()
      .max(MAX_REMARKS_LENGTH, "Remarks too long")
      .regex(safeTextRegex, "Invalid characters in remarks")
      .optional(),

    is_active: z.boolean().optional(),
  })

  /* ======================================================
     CROSS-FIELD RULES
  ====================================================== */

  .superRefine((data, ctx) => {
    if (
      data.butler_alternate_mobile &&
      data.butler_alternate_mobile === data.butler_mobile
    ) {
      ctx.addIssue({
        path: ["butler_alternate_mobile"],
        message: "Alternate mobile must be different from primary",
        code: z.ZodIssueCode.custom,
      });
    }
  });

/* ======================================================
   TYPE
====================================================== */

export type ButlerManagementSchema = z.infer<
  typeof butlerManagementSchema
>;
