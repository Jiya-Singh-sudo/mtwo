import { z } from "zod";

/* ======================================================
   CONSTANTS (STATIC, AUDIT-SAFE)
====================================================== */

const MAX_ROOM_NO_LENGTH = 20;
const MAX_TEXT_LENGTH = 100;
const MAX_REMARKS_LENGTH = 500;

const MAX_ROOM_CAPACITY = 20;

const roomNoRegex = /^[A-Za-z0-9-]+$/;
// const nameRegex = /^[A-Za-z .\-]*$/;
const safeTextRegex = /^[A-Za-z0-9 ,./()\-]*$/;
const mobileRegex = /^[6-9]\d{9}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

/* ======================================================
   HELPERS
====================================================== */

const parseDate = (d: string) => new Date(`${d}T00:00:00`);
const diffDays = (a: Date, b: Date) =>
  Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

/* ======================================================
   ROOM (ADD + EDIT)
====================================================== */

export const roomCreateEditSchema = z.object({
  room_no: z
    .string()
    .min(1, "Room number is required")
    .max(MAX_ROOM_NO_LENGTH, "Room number too long")
    .regex(roomNoRegex, "Only letters, numbers and hyphens allowed"),

  room_name: z
    .string()
    .min(1, "Room name is required")
    .max(MAX_TEXT_LENGTH, "Room name too long")
    .regex(safeTextRegex, "Invalid characters in room name"),

  building_name: z
    .string()
    .min(1, "Building name is required")
    .max(MAX_TEXT_LENGTH, "Building name too long")
    .regex(safeTextRegex, "Invalid characters in building name"),

  residence_type: z
    .string()
    .min(1, "Residence type is required")
    .max(MAX_TEXT_LENGTH, "Residence type too long"),

  room_type: z
    .string()
    .min(1, "Room type is required")
    .max(MAX_TEXT_LENGTH, "Room type too long"),

  room_category: z
    .string()
    .min(1, "Room category is required")
    .max(MAX_TEXT_LENGTH, "Room category too long"),

  room_capacity: z
    .coerce
    .number()
    .int("Capacity must be a whole number")
    .min(1, "Minimum capacity is 1")
    .max(MAX_ROOM_CAPACITY, "Capacity exceeds allowed limit"),

  status: z.enum(["Available", "Occupied"]),
});
/* ======================================================
   ROOM BOY ASSIGNMENT
====================================================== */

export const roomBoyManagementSchema = z
  .object({
    room_boy_id: z.string().min(1, "Room boy is required"),

    assignment_start_date: z
      .string()
      .regex(dateRegex, "Invalid date format (YYYY-MM-DD)"),

    shift: z.enum(["Morning", "Evening", "Night", "Full-Day"]),

    remarks: z
      .string()
      .max(MAX_REMARKS_LENGTH, "Remarks cannot exceed 500 characters")
      .regex(safeTextRegex, "Invalid characters in remarks")
      .optional(),
  })
  .superRefine((data, ctx) => {
    const taskDate = parseDate(data.assignment_start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (taskDate < today) {
      ctx.addIssue({
        path: ["assignment_start_date"],
        message: "Task date cannot be in the past",
        code: z.ZodIssueCode.custom,
      });
    }
  });

  
/* ======================================================
   ROOM BOY (ADD)
====================================================== */

export const housekeepingCreateEditSchema = z.object({
  hk_name: z
    .string()
    .min(1, "Name is required")
    .max(MAX_TEXT_LENGTH, "Name too long")
    .regex(safeTextRegex, "Invalid characters in name"),

  hk_name_local_language: z
    .string()
    .max(MAX_TEXT_LENGTH, "Local name too long")
    .optional(),

  hk_contact: z
    .string()
    .regex(mobileRegex, "Enter valid 10 digit mobile number"),

  hk_alternate_contact: z
    .string()
    .optional()
    .refine(
      (val) => !val || mobileRegex.test(val),
      { message: "Alternate contact must be 10 digits" }
    ),

  address: z
    .string()
    .max(250, "Address too long")
    .regex(safeTextRegex, "Invalid characters in address")
    .optional(),

  shift: z.enum(["Morning", "Evening", "Night", "Full-Day"]),
});

/* ======================================================
   GUEST ROOM ASSIGNMENT (ADD)
====================================================== */
export const guestRoomAssignSchema = z
  .object({
    guest_id: z.string().min(1, "Guest is required"),
    room_id: z.string().min(1, "Room is required"),

    check_in_date: z
      .string()
      .regex(dateRegex, "Invalid date format (YYYY-MM-DD)"),

    check_out_date: z
      .string()
      .regex(dateRegex, "Invalid date format (YYYY-MM-DD)")
      .optional(),
  })
  .superRefine((data, ctx) => {
    const inDate = parseDate(data.check_in_date);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    /* ---------- CHECK-IN DATE RULE ---------- */
    if (inDate < today) {
      ctx.addIssue({
        path: ["check_in_date"],
        message: "Check-in date cannot be before today",
        code: z.ZodIssueCode.custom,
      });
    }

    if (data.check_out_date) {
      const outDate = parseDate(data.check_out_date);

      if (outDate < inDate) {
        ctx.addIssue({
          path: ["check_out_date"],
          message: "Check-out cannot be before check-in",
          code: z.ZodIssueCode.custom,
        });
      }

      if (diffDays(inDate, outDate) > 10) {
        ctx.addIssue({
          path: ["check_out_date"],
          message: "Stay period cannot exceed 10 days",
          code: z.ZodIssueCode.custom,
        });
      }
    }
  });

export const roomBoyAssignmentSchema = z
  .object({
    room_boy_id: z.string().min(1, "Room boy is required"),

    remarks: z
      .string()
      .max(MAX_REMARKS_LENGTH, "Remarks cannot exceed 500 characters")
      .regex(safeTextRegex, "Invalid characters in remarks")
      .transform(v => v.replace(/[\r\n]+/g, " "))
      .optional(),
  })
  // .superRefine((data, ctx) => {
  //   const taskDate = parseDate(data.assignment_start_date);
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);

  //   if (taskDate < today) {
  //     ctx.addIssue({
  //       path: ["assignment_start_date"],
  //       message: "Task date cannot be in the past",
  //       code: z.ZodIssueCode.custom,
  //     });
  //   }

  //   if (diffDays(today, taskDate) > 7) {
  //     ctx.addIssue({
  //       path: ["assignment_start_date"],
  //       message: "Task date cannot be more than 7 days ahead",
  //       code: z.ZodIssueCode.custom,
  //     });
  //   }
  // });

/* ======================================================
   TYPES
====================================================== */

export type RoomCreateEditSchema = z.infer<typeof roomCreateEditSchema>;
export type RoomBoyAssignmentSchema = z.infer<typeof roomBoyAssignmentSchema>;
export type HousekeepingCreateEditSchema = z.infer<typeof housekeepingCreateEditSchema>;
export type GuestRoomAssignSchema = z.infer<typeof guestRoomAssignSchema>;
export type RoomBoyManagementSchema = z.infer<typeof roomBoyManagementSchema>;