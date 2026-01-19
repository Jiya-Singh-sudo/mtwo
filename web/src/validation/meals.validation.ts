import { z } from "zod";

/* ======================================================
   CONSTANTS
====================================================== */

const MAX_NAME_LENGTH = 100;
const MAX_DESC_LENGTH = 250;

const safeTextRegex = /^[A-Za-z0-9 ,./()\-]*$/;

/* ======================================================
   MAIN SCHEMA
====================================================== */

export const mealManagementSchema = z.object({
  food_name: z
    .string()
    .min(1, "Food name is required")
    .max(MAX_NAME_LENGTH, "Food name too long")
    .regex(safeTextRegex, "Invalid characters in food name"),

  food_desc: z
    .string()
    .max(MAX_DESC_LENGTH, "Description too long")
    .regex(safeTextRegex, "Invalid characters in description")
    .optional(),

  food_type: z.enum(["Veg", "Non-Veg", "Jain", "Vegan", "Egg"]),

  is_active: z.boolean().optional(),
});

/* ======================================================
   TYPE
====================================================== */

export type MealManagementSchema = z.infer<
  typeof mealManagementSchema
>;
