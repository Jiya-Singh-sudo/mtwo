import { z } from "zod";

export const networkProviderSchema = z.object({
  provider_name: z
    .string()
    .min(1, "Provider name is required")
    .max(100, "Maximum 100 characters"),

  provider_name_local_language: z
    .string()
    .max(100, "Maximum 100 characters")
    .optional()
    .or(z.literal("")),

  network_type: z.enum(["WiFi", "Broadband", "Hotspot", "Leased-Line"]),

  bandwidth_mbps: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ invalid_type_error: "Must be a number" })
      .int("Must be an integer")
      .min(1, "Must be at least 1 Mbps")
      .optional()
  ),

  username: z
    .string()
    .max(50, "Maximum 50 characters")
    .optional()
    .or(z.literal("")),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100)
    .optional()
    .or(z.literal("")),

  static_ip: z
    .string()
    .regex(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      "Invalid IPv4 address"
    )
    .optional()
    .or(z.literal("")),

  address: z
    .string()
    .max(200, "Maximum 200 characters")
    .optional()
    .or(z.literal("")),
});

export type NetworkProviderInput = z.infer<typeof networkProviderSchema>;

export const networkProviderUpdateSchema = networkProviderSchema.partial().extend({
  is_active: z.boolean().optional(),
});
