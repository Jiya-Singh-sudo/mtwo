import { z } from "zod";

export const userSchema = z.object({
  username: z.string().min(3, "Username is required"),
  full_name: z.string().min(2, "Full name is required"),
  full_name_local_language: z.string().optional(),

  role_id: z.string().min(1, "Role is required"),

  user_mobile: z.string()
    .regex(/^[0-9]{10}$/, "Mobile must be 10 digits")
    .optional(),

  user_alternate_mobile: z.string()
    .regex(/^[0-9]{10}$/, "Alternate mobile must be 10 digits")
    .optional(),

  password: z.string().min(6, "Password must be at least 6 characters"),

  email: z.string().email("Invalid email").optional()
});

// For update, everything is optional
export const userUpdateSchema = userSchema.partial().extend({
  is_active: z.boolean().optional()
});

// Login validation
export const userLoginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(1)
});
