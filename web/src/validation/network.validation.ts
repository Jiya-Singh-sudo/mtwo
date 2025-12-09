import { z } from "zod";

export const wifiProviderSchema = z.object({
    
  provider_name: z.string().min(2, "Provider name is required"),
  provider_name_local_language: z.string().optional(),

  network_type: z.enum(["WiFi", "Broadband", "Hotspot", "Leased-Line"]),

  bandwidth_mbps: z.number().int().positive().optional(),

  username: z.string().optional(),
  password: z.string().min(1, "Password is required"), // plaintext → backend hashes SHA-256

  static_ip: z.string()
    .regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, "Invalid IPv4 address")
    .optional(),

//   static_ip: z.string()
//     .ip({ version: "v4" })
//     .optional(),

  address: z.string().optional()
});

export const wifiProviderUpdateSchema = wifiProviderSchema.partial().extend({
  is_active: z.boolean().optional()
});
