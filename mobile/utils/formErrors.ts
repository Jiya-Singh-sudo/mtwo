// mobile/utils/formErrors.ts
// Convert Zod errors to a flat record for form display

import { ZodError } from "zod";

export function zodToFormErrors(err: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export function validateSingleField(
  schema: any,
  fieldName: string,
  value: any,
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
) {
  try {
    // Create a partial object with just this field
    const partialData: Record<string, any> = { [fieldName]: value };
    // Try to parse the field using shape if available
    const fieldSchema = schema._def?.schema?._def?.shape?.() || schema.shape;
    if (fieldSchema && fieldSchema[fieldName]) {`1`
      fieldSchema[fieldName].parse(value);
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  } catch (err: any) {
    if (err instanceof ZodError) {
      const firstMessage = err.issues[0]?.message || "Invalid";
      setFormErrors((prev) => ({
        ...prev,
        [fieldName]: firstMessage,
      }));
    }
  }
}
