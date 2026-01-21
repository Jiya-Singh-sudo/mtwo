import { z } from "zod";

export const messengerCreateSchema = z.object({
    messenger_name: z
        .string()
        .min(1, "Name is required")
        .max(50, "Maximum 50 characters")
        .regex(/^[a-zA-Z\s]+$/, "Only letters and spaces allowed"),

    primary_mobile: z
        .string()
        .regex(/^\d{10}$/, "Enter a valid 10-digit mobile number"),

    email: z
        .string()
        .email("Enter a valid email address")
        .max(100)
        .optional()
        .or(z.literal("")),
});

export type MessengerCreateInput = z.infer<typeof messengerCreateSchema>;
