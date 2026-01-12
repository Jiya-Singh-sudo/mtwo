import { z } from "zod";

/* ======================================================
   CONSTANTS (STATIC, AUDIT-SAFE)
====================================================== */

const MIN_YEAR = 2025;
const MAX_YEAR = 2026;
const MAX_ROOM_STAY_DAYS = 90;

const safeTextRegex = /^[A-Za-z0-9 \s,./()\-]*$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}$/;

/* ======================================================
   HELPERS
====================================================== */

const parseDate = (d: string) => new Date(`${d}T00:00:00`);

const diffDays = (a: Date, b: Date) =>
  Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

/* ======================================================
   MAIN SCHEMA
====================================================== */

export const roomManagementSchema = z
  .object({
    /* ---------------- IDENTIFIERS ---------------- */

    guest_id: z.string().min(1, "Guest is required"),

    room_id: z.string().min(1, "Room selection is required"),

    room_number: z
      .string()
      .regex(safeTextRegex, "Invalid characters in room number")
      .optional(),

    room_type: z.string().optional(),

    /* ---------------- ALLOCATION PERIOD ---------------- */

    room_checkin_date: z
      .string()
      .regex(dateRegex, "Invalid date format (YYYY-MM-DD)"),

    room_checkin_time: z
      .string()
      .regex(timeRegex, "Invalid time format (HH:mm)"),

    room_checkout_date: z
      .string()
      .regex(dateRegex, "Invalid date format (YYYY-MM-DD)")
      .optional(),

    room_checkout_time: z
      .string()
      .regex(timeRegex, "Invalid time format (HH:mm)")
      .optional(),

    /* ---------------- STATUS & CONTROL ---------------- */

    room_status: z.enum([
      "Reserved",
      "Occupied",
      "Vacant",
      "Maintenance",
      "Blocked",
    ]),

    housekeeping_required: z.boolean().optional(),

    remarks: z
      .string()
      .max(500, "Remarks cannot exceed 500 characters")
      .regex(safeTextRegex, "Invalid characters in remarks")
      .optional(),
  })

  /* ======================================================
     CROSS-FIELD & BUSINESS RULES
  ====================================================== */

  .superRefine((data, ctx) => {
    const {
      room_checkin_date,
      room_checkin_time,
      room_checkout_date,
      room_checkout_time,
      room_status,
    } = data;

    /* ---------- CHECK-IN DATE RULES ---------- */

    const inDate = parseDate(room_checkin_date);
    const inYear = inDate.getFullYear();

    if (inYear < MIN_YEAR || inYear > MAX_YEAR) {
      ctx.addIssue({
        path: ["room_checkin_date"],
        message: "Check-in date outside allowed year range",
        code: z.ZodIssueCode.custom,
      });
    }

    /* ---------- CHECK-OUT DATE RULES ---------- */

    if (room_checkout_date) {
      const outDate = parseDate(room_checkout_date);

      if (outDate < inDate) {
        ctx.addIssue({
          path: ["room_checkout_date"],
          message: "Check-out date cannot be before check-in date",
          code: z.ZodIssueCode.custom,
        });
      }

      const stayDays = diffDays(inDate, outDate);
      if (stayDays > MAX_ROOM_STAY_DAYS) {
        ctx.addIssue({
          path: ["room_checkout_date"],
          message: "Room stay cannot exceed 90 days",
          code: z.ZodIssueCode.custom,
        });
      }
    }

    /* ---------- TIME ORDER RULE ---------- */

    if (room_checkout_date && room_checkout_time) {
      const inDT = new Date(
        `${room_checkin_date}T${room_checkin_time}`
      );
      const outDT = new Date(
        `${room_checkout_date}T${room_checkout_time}`
      );

      if (outDT <= inDT) {
        ctx.addIssue({
          path: ["room_checkout_time"],
          message: "Check-out time must be after check-in time",
          code: z.ZodIssueCode.custom,
        });
      }
    }

    /* ---------- STATUS-DRIVEN RULES ---------- */

    if (
      room_status === "Occupied" &&
      (!room_checkin_date || !room_checkin_time)
    ) {
      ctx.addIssue({
        path: ["room_status"],
        message: "Occupied room must have check-in date and time",
        code: z.ZodIssueCode.custom,
      });
    }

    if (
      room_status === "Vacant" &&
      (!room_checkout_date || !room_checkout_time)
    ) {
      ctx.addIssue({
        path: ["room_status"],
        message: "Vacant room must have check-out date and time",
        code: z.ZodIssueCode.custom,
      });
    }

    if (room_status === "Maintenance" && !data.remarks) {
      ctx.addIssue({
        path: ["remarks"],
        message: "Remarks required for maintenance status",
        code: z.ZodIssueCode.custom,
      });
    }
  });

/* ======================================================
   TYPE
====================================================== */

export type RoomManagementSchema = z.infer<
  typeof roomManagementSchema
>;
