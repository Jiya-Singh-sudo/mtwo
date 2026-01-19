import { z } from "zod";

/* ======================================================
   CONSTANTS (STATIC, AUDIT-SAFE)
====================================================== */

const MAX_NAME_LENGTH = 100;
const MAX_ADDRESS_LENGTH = 250;

const nameRegex = /^[A-Za-z .]*$/;
const mobileRegex = /^[6-9]\d{9}$/;

// Indian driving licence (broad but safe)
// e.g. MH4620250006754, MH-04-20110012345
const licenseRegex = /^[A-Z]{2}[- ]?\d{2}[- ]?\d{4}\d{7}$/;

const safeTextRegex = /^[A-Za-z0-9 ,./()\-]*$/;

/* ======================================================
   DRIVER SCHEMA (ADD + EDIT)
====================================================== */

export const driverCreateEditSchema = z
  .object({
    driver_name: z
      .string()
      .min(1, "Full name is required")
      .max(MAX_NAME_LENGTH, "Name too long")
      .regex(nameRegex, "Only letters, space and dot allowed"),

    driver_name_local: z
      .string()
      .max(MAX_NAME_LENGTH, "Local name too long")
      .optional(),

    contact_number: z
      .string()
      .regex(mobileRegex, "Enter valid 10 digit mobile number"),

    alternate_contact_number: z
      .string()
      .optional()
      .refine(
        (val) => !val || mobileRegex.test(val),
        { message: "Alternate contact must be 10 digits" }
      ),

    license_number: z
      .string()
      .min(1, "License number is required")
      .regex(licenseRegex, "Invalid driving license number"),

    address: z
      .string()
      .max(MAX_ADDRESS_LENGTH, "Address too long")
      .regex(safeTextRegex, "Invalid characters in address")
      .optional(),
  })

  /* ======================================================
     CROSS-FIELD RULES
  ====================================================== */

  .superRefine((data, ctx) => {
    if (
      data.alternate_contact_number &&
      data.alternate_contact_number === data.contact_number
    ) {
      ctx.addIssue({
        path: ["alternate_contact_number"],
        message: "Alternate contact must be different from primary",
        code: z.ZodIssueCode.custom,
      });
    }
  });

/* ======================================================
   TYPE
====================================================== */

export type DriverSchema = z.infer<
  typeof driverCreateEditSchema
>;

/* ======================================================
   CONSTANTS
====================================================== */

const MAX_VEHICLE_NAME_LENGTH = 100;
const MAX_MODEL_LENGTH = 50;
const MAX_COLOR_LENGTH = 30;

const vehicleNumberRegex =
  /^[A-Z]{2}-?\d{2}-?[A-Z]{1,2}-?\d{4}$/;
// e.g. MH-01-AB-1234, MH01AB1234

/* ======================================================
   HELPERS
====================================================== */

const currentYear = new Date().getFullYear();

/* ======================================================
   VEHICLE SCHEMA (ADD + EDIT)
====================================================== */

export const vehicleCreateEditSchema = z
  .object({
    vehicle_number: z
      .string()
      .min(1, "Vehicle number is required")
      .regex(vehicleNumberRegex, "Invalid vehicle number format"),

    vehicle_name: z
      .string()
      .min(1, "Vehicle name is required")
      .max(MAX_VEHICLE_NAME_LENGTH, "Vehicle name too long")
      .regex(safeTextRegex, "Invalid characters in vehicle name"),

    model: z
      .string()
      .max(MAX_MODEL_LENGTH, "Model name too long")
      .regex(safeTextRegex, "Invalid characters in model")
      .optional(),

    manufacturing_year: z
      .coerce
      .number()
      .int("Manufacturing year must be a number")
      .min(1980, "Manufacturing year is too old")
      .max(currentYear + 1, "Manufacturing year cannot be in the future")
      .optional(),

    capacity: z
      .coerce
      .number()
      .int("Capacity must be a whole number")
      .min(1, "Capacity must be at least 1")
      .max(50, "Capacity exceeds allowed limit")
      .optional(),

    color: z
      .string()
      .max(MAX_COLOR_LENGTH, "Color name too long")
      .regex(safeTextRegex, "Invalid characters in color")
      .optional(),
  });

/* ======================================================
   TYPE
====================================================== */

export type VehicleSchema = z.infer<
  typeof vehicleCreateEditSchema
>;
