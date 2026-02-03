import { z } from "zod";

export const messengerCreateSchema = z.object({
    messenger_name: z
        .string()
        .min(1, "Name is required")
        .max(50, "Maximum 50 characters")
        .regex(/^[a-zA-Z\s]+$/, "Only letters and spaces allowed"),

    messenger_name_local_language: z
        .string()
        .max(100, "Maximum 100 characters")
        .optional()
        .or(z.literal("")),

    primary_mobile: z
        .string()
        .regex(/^\d{10}$/, "Enter a valid 10-digit mobile number"),

    secondary_mobile: z
        .string()
        .regex(/^\d{10}$/, "Enter a valid 10-digit mobile number")
        .optional()
        .or(z.literal("")),

    email: z
        .string()
        .email("Enter a valid email address")
        .max(100)
        .optional()
        .or(z.literal("")),

    designation: z
        .string()
        .max(50, "Maximum 50 characters")
        .optional()
        .or(z.literal("")),

    remarks: z
        .string()
        .max(500, "Maximum 500 characters")
        .optional()
        .or(z.literal("")),
});

export type MessengerCreateInput = z.infer<typeof messengerCreateSchema>;
