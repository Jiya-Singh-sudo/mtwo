import { z } from "zod";

/* ======================================================
   CONSTANTS (STATIC, AUDIT-SAFE)
====================================================== */

const MIN_YEAR = 2025;
const MAX_YEAR = 2026;

const MAX_NAME_LENGTH = 100;
const MAX_REMARKS_LENGTH = 500;

const nameRegex = /^[A-Za-z .]*$/;
const mobileRegex = /^[6-9]\d{9}$/;
const safeTextRegex = /^[A-Za-z0-9 \s,./()\-]*$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

/* ======================================================
   HELPERS
====================================================== */

const parseDate = (d: string) => new Date(`${d}T00:00:00`);

/* ======================================================
   MAIN SCHEMA
====================================================== */

export const roomBoyManagementSchema = z
  .object({
    /* ---------------- BASIC IDENTITY ---------------- */

    room_boy_id: z.string().optional(),

    room_boy_name: z
      .string()
      .min(1, "Room boy name is required")
      .max(MAX_NAME_LENGTH, "Name too long")
      .regex(nameRegex, "Only letters, space and dot allowed"),

    mobile: z
      .string()
      .regex(mobileRegex, "Enter valid 10 digit mobile number"),

    alternate_mobile: z.string().optional(),

    /* ---------------- STATUS ---------------- */

    status: z.enum(["Active", "Inactive", "On Leave", "Scheduled"]),

    /* ---------------- ASSIGNMENT ---------------- */

    assigned_room_id: z.string().optional(),

    assignment_start_date: z
      .string()
      .regex(dateRegex, "Invalid date format (YYYY-MM-DD)")
      .optional(),

    assignment_end_date: z
      .string()
      .regex(dateRegex, "Invalid date format (YYYY-MM-DD)")
      .optional(),

    /* ---------------- META ---------------- */

    remarks: z
      .string()
      .max(MAX_REMARKS_LENGTH, "Remarks cannot exceed 500 characters")
      .regex(safeTextRegex, "Invalid characters in remarks")
      .optional(),
    
      shift: z.enum(["Morning", "Evening", "Night", "Full-Day"]),
  })

  /* ======================================================
     CROSS-FIELD & BUSINESS RULES
  ====================================================== */

  .superRefine((data, ctx) => {
    const {
      mobile,
      alternate_mobile,
      status,
      assigned_room_id,
      assignment_start_date,
      assignment_end_date,
      remarks,
    } = data;

    /* ---------- MOBILE RULES ---------- */

    if (alternate_mobile && alternate_mobile === mobile) {
      ctx.addIssue({
        path: ["alternate_mobile"],
        message: "Alternate number must be different",
        code: z.ZodIssueCode.custom,
      });
    }

    /* ---------- STATUS vs ASSIGNMENT ---------- */

    if (
      assigned_room_id &&
      (status === "Inactive" || status === "On Leave")
    ) {
      ctx.addIssue({
        path: ["status"],
        message: "Inactive or On Leave staff cannot be assigned rooms",
        code: z.ZodIssueCode.custom,
      });
    }

    /* ---------- ASSIGNMENT DATE RULES ---------- */

    if (assignment_start_date) {
      const startDate = parseDate(assignment_start_date);
      const year = startDate.getFullYear();

      if (year < MIN_YEAR || year > MAX_YEAR) {
        ctx.addIssue({
          path: ["assignment_start_date"],
          message: "Assignment date outside allowed year range",
          code: z.ZodIssueCode.custom,
        });
      }
    }

    if (assignment_start_date && assignment_end_date) {
      const start = parseDate(assignment_start_date);
      const end = parseDate(assignment_end_date);

      if (end < start) {
        ctx.addIssue({
          path: ["assignment_end_date"],
          message: "Assignment end date cannot be before start date",
          code: z.ZodIssueCode.custom,
        });
      }
    }

    /* ---------- REQUIRED REMARKS ---------- */

    if (
      (status === "Inactive" || status === "On Leave") &&
      !remarks
    ) {
      ctx.addIssue({
        path: ["remarks"],
        message: "Remarks required for inactive or on-leave staff",
        code: z.ZodIssueCode.custom,
      });
    }

    /* ---------- CONSISTENCY RULE ---------- */

    if (assigned_room_id && !assignment_start_date) {
      ctx.addIssue({
        path: ["assignment_start_date"],
        message: "Assignment start date is required when room is assigned",
        code: z.ZodIssueCode.custom,
      });
    }
  });

/* ======================================================
   TYPE
====================================================== */

export type RoomBoyManagementSchema = z.infer<
  typeof roomBoyManagementSchema
>;
