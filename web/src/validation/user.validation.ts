import { z } from "zod";

/* ======================================================
   CONSTANTS
====================================================== */

const MAX_NAME_LENGTH = 100;
const MAX_ADDRESS_LENGTH = 250;

const usernameRegex = /^[a-zA-Z0-9_]+$/;
const nameRegex = /^[A-Za-z .]*$/;
const mobileRegex = /^[6-9]\d{9}$/;
const safeTextRegex = /^[A-Za-z0-9 ,./()\-]*$/;

/* ======================================================
   CREATE USER
====================================================== */

export const userCreateSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username too long")
      .regex(usernameRegex, "Only letters, numbers and underscore allowed"),

    full_name: z
      .string()
      .min(2, "Full name is required")
      .max(MAX_NAME_LENGTH, "Name too long")
      .regex(nameRegex, "Only letters, space and dot allowed"),

    full_name_local_language: z
      .string()
      .max(MAX_NAME_LENGTH, "Local name too long")
      .optional(),

    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),

    user_mobile: z
      .string()
      .regex(mobileRegex, "Enter valid 10 digit mobile number"),

    user_alternate_mobile: z
      .string()
      .optional()
      .refine(
        (val) => !val || mobileRegex.test(val),
        { message: "Alternate mobile must be 10 digits" }
      ),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),

    role_id: z
      .string()
      .min(1, "Role is required"),

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
      data.user_alternate_mobile &&
      data.user_alternate_mobile === data.user_mobile
    ) {
      ctx.addIssue({
        path: ["user_alternate_mobile"],
        message: "Alternate mobile must be different",
        code: z.ZodIssueCode.custom,
      });
    }
  });

/* ======================================================
   UPDATE USER
====================================================== */

export const userUpdateSchema = userCreateSchema
  .omit({ password: true }) // password not mandatory in edit
  .partial()
  .extend({
    is_active: z.boolean().optional(),
  });

/* ======================================================
   LOGIN
====================================================== */

export const userLoginSchema = z.object({
  username: z.string().min(3, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

/* ======================================================
   TYPES
====================================================== */

export type UserCreateSchema = z.infer<typeof userCreateSchema>;
export type UserUpdateSchema = z.infer<typeof userUpdateSchema>;