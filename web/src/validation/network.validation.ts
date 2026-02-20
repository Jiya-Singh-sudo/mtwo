import { z } from "zod";

/* ======================================================
   CONSTANTS
====================================================== */

const MAX_NAME_LENGTH = 100;
const MAX_ADDRESS_LENGTH = 250;
const MAX_USERNAME_LENGTH = 50;
const MAX_PASSWORD_LENGTH = 100;

const nameRegex = /^[A-Za-z0-9 .&\-()]*$/;
const safeTextRegex = /^[A-Za-z0-9 ,./()\-]*$/;
const ipv4Regex =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/* ======================================================
   CREATE SCHEMA
====================================================== */

export const networkProviderSchema = z
  .object({
    provider_name: z
      .string()
      .trim()
      .min(1, "Provider name is required")
      .max(MAX_NAME_LENGTH, "Provider name too long")
      .regex(nameRegex, "Invalid characters in provider name"),

    provider_name_local_language: z
      .string()
      .trim()
      .max(MAX_NAME_LENGTH, "Local name too long")
      .optional(),

    network_type: z.enum([
      "WiFi",
      "Broadband",
      "Hotspot",
      "Leased-Line",
    ]),

    bandwidth_mbps: z
      .preprocess(
        (val) => (val === "" || val === undefined ? undefined : Number(val)),
        z
          .number()
          .int("Must be a whole number")
          .min(1, "Minimum 1 Mbps")
          .max(100000, "Unrealistic bandwidth")
          .optional()
      ),

    username: z
      .string()
      .trim()
      .max(MAX_USERNAME_LENGTH, "Username too long")
      .optional(),

    password: z
      .string()
      .trim()
      .min(6, "Password must be at least 6 characters")
      .max(MAX_PASSWORD_LENGTH, "Password too long")
      .optional(),

    static_ip: z
      .string()
      .trim()
      .regex(ipv4Regex, "Invalid IPv4 address")
      .optional(),

    address: z
      .string()
      .trim()
      .max(MAX_ADDRESS_LENGTH, "Address too long")
      .regex(safeTextRegex, "Invalid characters in address")
      .transform((v) => v.replace(/[\r\n]+/g, " "))
      .optional(),
  })

  /* ======================================================
     CROSS-FIELD RULES
  ====================================================== */

  .superRefine((data, ctx) => {
    // If password provided → username must exist
    if (data.password && !data.username) {
      ctx.addIssue({
        path: ["username"],
        message: "Username required when password is provided",
        code: z.ZodIssueCode.custom,
      });
    }

    // If username provided → password required
    if (data.username && !data.password) {
      ctx.addIssue({
        path: ["password"],
        message: "Password required when username is provided",
        code: z.ZodIssueCode.custom,
      });
    }

    // Prevent static IP on Hotspot (example business rule)
    if (data.network_type === "Hotspot" && data.static_ip) {
      ctx.addIssue({
        path: ["static_ip"],
        message: "Static IP not allowed for Hotspot",
        code: z.ZodIssueCode.custom,
      });
    }
  });

/* ======================================================
   UPDATE SCHEMA
====================================================== */

export const networkProviderUpdateSchema = networkProviderSchema
  .partial()
  .extend({
    is_active: z.boolean().optional(),
  });

/* ======================================================
   TYPES
====================================================== */

export type NetworkProviderInput = z.infer<
  typeof networkProviderSchema
>;
export type NetworkProviderUpdateInput = z.infer<
  typeof networkProviderUpdateSchema
>;