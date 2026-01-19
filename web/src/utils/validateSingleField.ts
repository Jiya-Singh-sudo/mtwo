import { ZodObject, ZodRawShape, ZodError } from "zod";

export function validateSingleField<T extends ZodRawShape>(
    schema: ZodObject<T>,
    field: keyof T,
    value: any,
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
) {
    try {
        schema
            .pick({ [field]: true } as any)
            .parse({ [field]: value });

        // clear error if valid
        setErrors(prev => {
            const next = { ...prev };
            delete next[field as string];
            return next;
        });
    } catch (err) {
        if (err instanceof ZodError) {
            setErrors(prev => ({
                ...prev,
                [field as string]: err.issues[0]?.message,
            }));
        }
    }
}
