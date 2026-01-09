import { z } from "zod";

export const designationSchema = z
  .object({
    designation_id: z.string().optional(), // backend responsibility
    designation_name: z.string().optional(),
    designation_name_local_language: z.string().optional(),
    department: z.string().optional(),
    organization: z.string().optional(),
    office_location: z.string().optional(),
  })
  .refine(
    (data) => {
      // If user starts entering a designation manually,
      // ONLY designation_name is required (not ID)
      if (
        data.organization ||
        data.office_location ||
        data.department
      ) {
        return Boolean(data.designation_name);
      }
      return true;
    },
    {
      message: "Designation Name is required",
      path: ["designation_name"],
    }
  );

export const designationUpdateSchema = designationSchema.partial().extend({
  is_active: z.boolean().optional(),
});
