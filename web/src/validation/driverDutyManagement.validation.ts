import { z } from "zod";

/* ======================================================
   CONSTANTS
====================================================== */

const timeRegex = /^\d{2}:\d{2}$/;

/* ======================================================
   HELPERS
====================================================== */

const parseTime = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m; // minutes since midnight
};

/* ======================================================
   DUTY EDIT SCHEMA
====================================================== */

export const driverDutyEditSchema = z
    .object({
        shift: z.enum(["Morning", "Evening", "Night", "Full-Day"], {
            message: "Shift is required",
        }),

        week_off: z.boolean(),

        duty_in_time: z
            .string()
            .regex(timeRegex, "Invalid duty in time format (HH:mm)")
            .optional(),

        duty_out_time: z
            .string()
            .regex(timeRegex, "Invalid duty out time format (HH:mm)")
            .optional(),
    })

    /* ======================================================
       CROSS-FIELD & BUSINESS RULES
    ====================================================== */

    .superRefine((data, ctx) => {
        const {
            week_off,
            duty_in_time,
            duty_out_time,
        } = data;

        /* ---------- WEEK OFF RULES ---------- */

        if (week_off) {
            if (duty_in_time) {
                ctx.addIssue({
                    path: ["duty_in_time"],
                    message: "Duty time must be empty on week off",
                    code: z.ZodIssueCode.custom,
                });
            }

            if (duty_out_time) {
                ctx.addIssue({
                    path: ["duty_out_time"],
                    message: "Duty time must be empty on week off",
                    code: z.ZodIssueCode.custom,
                });
            }

            return; // stop further checks
        }

        /* ---------- REQUIRED TIME RULES ---------- */

        if (!duty_in_time) {
            ctx.addIssue({
                path: ["duty_in_time"],
                message: "Duty in time is required",
                code: z.ZodIssueCode.custom,
            });
        }

        if (!duty_out_time) {
            ctx.addIssue({
                path: ["duty_out_time"],
                message: "Duty out time is required",
                code: z.ZodIssueCode.custom,
            });
        }

        if (!duty_in_time || !duty_out_time) return;

        /* ---------- TIME ORDER RULE ---------- */

        const inMinutes = parseTime(duty_in_time);
        const outMinutes = parseTime(duty_out_time);

        if (outMinutes <= inMinutes) {
            ctx.addIssue({
                path: ["duty_out_time"],
                message: "Duty out time must be after duty in time",
                code: z.ZodIssueCode.custom,
            });
        }
    });

/* ======================================================
   TYPE
====================================================== */

export type DriverDutyEditSchema = z.infer<typeof driverDutyEditSchema>;
