import { z } from "zod";

export const mealSchema = z.object({
  food_name: z.string().min(2, "Food name is required"),
  food_desc: z.string().optional(),
  food_type: z.enum(["Veg", "Non-Veg", "Jain", "Vegan", "Egg"]),
});

export const mealUpdateSchema = mealSchema.partial().extend({
  is_active: z.boolean().optional(),
});
