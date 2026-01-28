import { ZodError } from "zod";

/**
 * Converts ZodError into { fieldName: message }
 */
export function zodToFormErrors(err: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};

  err.issues.forEach(issue => {
    const field = issue.path.join(".");
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  });

  return errors;
}

/**
 * Safely clear a single field error
 */
export function clearFieldError(
  field: string,
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
) {
  setErrors(prev => {
    if (!prev[field]) return prev;
    const next = { ...prev };
    delete next[field];
    return next;
  });
}
