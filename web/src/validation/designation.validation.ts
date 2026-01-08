import { z } from "zod";

export const designationSchema = z
  .object({
    designation_id: z.string().optional(),
    designation_name: z.string().optional(),
    designation_name_local_language: z.string().optional(),
    department: z.string().optional(),
    organization: z.string().optional(),
    office_location: z.string().optional(),
  })
  .refine(
    (data) => {
      // If ANY designation detail is entered manually,
      // designation_id and designation_name are mandatory
      if (
        data.designation_name ||
        data.organization ||
        data.office_location ||
        data.department
      ) {
        return Boolean(data.designation_id && data.designation_name);
      }
      return true;
    },
    {
      message: "Designation ID and Name are required",
      path: ["designation_id"],
    }
  );

export const designationUpdateSchema = designationSchema.partial().extend({
  is_active: z.boolean().optional(),
});
