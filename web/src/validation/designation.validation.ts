import { z } from "zod";

export const designationSchema = z.object({
  designation_name: z.string().min(2, "Designation name is required"),
  designation_name_local_language: z.string().optional()
});

export const designationUpdateSchema = designationSchema.partial().extend({
  is_active: z.boolean().optional()
});
