import { z } from "zod";

/* ======================================================
   CONSTANTS (STATIC, AUDIT-SAFE)
====================================================== */

const MAX_LOCATION_LENGTH = 150;

const safeTextRegex = /^[A-Za-z0-9 ,./()\-]*$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}$/;

/* ======================================================
   HELPERS
====================================================== */

const parseDate = (d: string) => new Date(`${d}T00:00:00`);
const parseDateTime = (d: string, t: string) => new Date(`${d}T${t}:00`);

const todayMidnight = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
export const assignDriverSchema = z
  .object({
    driver_id: z.string().min(1, "Driver is required"),

    pickup_location: z
      .string()
      .min(1, "Pickup location is required")
      .max(MAX_LOCATION_LENGTH, "Pickup location too long")
      .regex(safeTextRegex, "Invalid characters in pickup location"),

    drop_location: z
      .string()
      .min(1, "Drop location is required")
      .max(MAX_LOCATION_LENGTH, "Drop location too long")
      .regex(safeTextRegex, "Invalid characters in drop location"),

    trip_date: z
      .string()
      .regex(dateRegex, "Invalid pickup date format (YYYY-MM-DD)"),

    pickup_time_from: z
      .string()
      .regex(timeRegex, "Invalid from-time format"),

    pickup_time_to: z
      .string()
      .regex(timeRegex, "Invalid to-time format"),

    drop_date: z
      .string()
      .regex(dateRegex, "Invalid drop date format"),

    drop_time: z
      .string()
      .regex(timeRegex, "Invalid drop time format"),
  })

  /* ======================================================
     CROSS-FIELD & BUSINESS RULES
  ====================================================== */

  .superRefine((data, ctx) => {
    const today = todayMidnight();

    const pickupDate = parseDate(data.trip_date);
    const dropDate = parseDate(data.drop_date);

    const pickupFromDT = parseDateTime(
      data.trip_date,
      data.pickup_time_from
    );

    const pickupToDT = parseDateTime(
      data.trip_date,
      data.pickup_time_to
    );

    const dropDT = parseDateTime(
      data.drop_date,
      data.drop_time
    );

    /* ---------- DATE RULES ---------- */

    if (pickupDate < today) {
      ctx.addIssue({
        path: ["pickup_date"],
        message: "Pickup date cannot be in the past",
        code: z.ZodIssueCode.custom,
      });
    }

    if (dropDate < pickupDate) {
      ctx.addIssue({
        path: ["drop_date"],
        message: "Drop date cannot be before pickup date",
        code: z.ZodIssueCode.custom,
      });
    }

    /* ---------- TIME RULES ---------- */

    if (pickupToDT <= pickupFromDT) {
      ctx.addIssue({
        path: ["pickup_time_to"],
        message: "To time must be after from time",
        code: z.ZodIssueCode.custom,
      });
    }

    if (dropDT <= pickupFromDT) {
      ctx.addIssue({
        path: ["drop_time"],
        message: "Drop time must be after pickup time",
        code: z.ZodIssueCode.custom,
      });
    }
  });

/* ======================================================
   TYPE
====================================================== */

export type AssignDriverSchema = z.infer<typeof assignDriverSchema>;

export const assignVehicleSchema = z
  .object({
    vehicle_no: z.string().min(1, "Vehicle is required"),

    location: z
      .string()
      .min(1, "Location is required")
      .max(MAX_LOCATION_LENGTH, "Location too long")
      .regex(safeTextRegex, "Invalid characters in location"),

    assigned_date: z
      .string()
      .regex(dateRegex, "Invalid assigned date"),

    assigned_time: z
      .string()
      .regex(timeRegex, "Invalid assigned time"),

    released_date: z
      .string()
      .regex(dateRegex, "Invalid released date")
      .optional(),

    released_time: z
      .string()
      .regex(timeRegex, "Invalid released time")
      .optional(),
  })
  .superRefine((data, ctx) => {
    const now = new Date();

    const assignedDT = parseDateTime(
      data.assigned_date,
      data.assigned_time
    );

    if (assignedDT < now) {
      ctx.addIssue({
        path: ["assigned_date"],
        message: "Assigned date-time cannot be in the past",
        code: z.ZodIssueCode.custom,
      });
    }

    if (data.released_date && data.released_time) {
      const releasedDT = parseDateTime(
        data.released_date,
        data.released_time
      );

      if (releasedDT <= assignedDT) {
        ctx.addIssue({
          path: ["released_date"],
          message: "Release must be after assigned time",
          code: z.ZodIssueCode.custom,
        });
      }
    }
  });


/* ======================================================
   TYPE
====================================================== */

export type AssignVehicleSchema = z.infer<typeof assignVehicleSchema>;
