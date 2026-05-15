import { z } from "zod";

/* ======================================================
   CONSTANTS
====================================================== */

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const SHIFT_OPTIONS = [
  "morning",
  "afternoon",
  "night",
  "full-day",
] as const;

/* ======================================================
   HELPERS
====================================================== */

const parseTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/* ======================================================
   DUTY EDIT SCHEMA
====================================================== */

export const driverDutyEditSchema = z
  .object({
    shift: z
      .enum(SHIFT_OPTIONS)
      .optional(),

    week_off: z.boolean().optional(),

    duty_in_time: z
      .string()
      .trim()
      .regex(timeRegex, "Invalid time format. Use HH:mm")
      .optional(),

    duty_out_time: z
      .string()
      .trim()
      .regex(timeRegex, "Invalid time format. Use HH:mm")
      .optional(),
  })

  /* ======================================================
     BUSINESS VALIDATIONS
  ====================================================== */

  .superRefine((data, ctx) => {
    const {
      week_off,
      shift,
      duty_in_time,
      duty_out_time,
    } = data;

    /* ======================================================
       WEEK OFF VALIDATIONS
    ====================================================== */

    if (week_off) {
      if (shift) {
        ctx.addIssue({
          path: ["shift"],
          message: "Shift should not be selected on week off",
          code: z.ZodIssueCode.custom,
        });
      }

      if (duty_in_time) {
        ctx.addIssue({
          path: ["duty_in_time"],
          message: "Duty in time should be empty on week off",
          code: z.ZodIssueCode.custom,
        });
      }

      if (duty_out_time) {
        ctx.addIssue({
          path: ["duty_out_time"],
          message: "Duty out time should be empty on week off",
          code: z.ZodIssueCode.custom,
        });
      }

      return;
    }

    /* ======================================================
       REQUIRED FIELD VALIDATIONS
    ====================================================== */

    if (!shift) {
      ctx.addIssue({
        path: ["shift"],
        message: "Shift is required",
        code: z.ZodIssueCode.custom,
      });
    }

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

    /* ======================================================
       TIME ORDER VALIDATION
    ====================================================== */

    const inMinutes = parseTime(duty_in_time);
    const outMinutes = parseTime(duty_out_time);

    if (outMinutes <= inMinutes) {
      ctx.addIssue({
        path: ["duty_out_time"],
        message: "Duty out time must be later than duty in time",
        code: z.ZodIssueCode.custom,
      });
    }

    /* ======================================================
       MAX DUTY HOURS VALIDATION
    ====================================================== */

    const dutyDuration = outMinutes - inMinutes;

    if (dutyDuration > 16 * 60) {
      ctx.addIssue({
        path: ["duty_out_time"],
        message: "Duty duration cannot exceed 16 hours",
        code: z.ZodIssueCode.custom,
      });
    }

    /* ======================================================
       MINIMUM DUTY HOURS VALIDATION
    ====================================================== */

    if (dutyDuration < 60) {
      ctx.addIssue({
        path: ["duty_out_time"],
        message: "Duty duration must be at least 1 hour",
        code: z.ZodIssueCode.custom,
      });
    }

    /* ======================================================
       SHIFT-BASED TIME VALIDATION
    ====================================================== */

    const inHour = Number(duty_in_time.split(":")[0]);

    if (shift === "morning" && inHour >= 12) {
      ctx.addIssue({
        path: ["duty_in_time"],
        message: "Morning shift must start before 12 PM",
        code: z.ZodIssueCode.custom,
      });
    }

    if (shift === "afternoon" && (inHour < 12 || inHour >= 18)) {
      ctx.addIssue({
        path: ["duty_in_time"],
        message: "Afternoon shift must start between 12 PM and 6 PM",
        code: z.ZodIssueCode.custom,
      });
    }

    if (shift === "night" && inHour < 18) {
      ctx.addIssue({
        path: ["duty_in_time"],
        message: "Night shift must start after 6 PM",
        code: z.ZodIssueCode.custom,
      });
    }
  });

/* ======================================================
   TYPE
====================================================== */

export type DriverDutyEditSchema = z.infer<
  typeof driverDutyEditSchema
>;