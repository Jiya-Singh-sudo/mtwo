import { z } from "zod";

/* ======================================================
   CONSTANTS (STATIC, AUDIT-SAFE)
====================================================== */

const MIN_YEAR = 2025;
const MAX_YEAR = 2026;
const MAX_STAY_DAYS = 90;

const MAX_NAME_LENGTH = 100;
const MAX_ADDRESS_LENGTH = 250;

const nameRegex = /^[A-Za-z .]*$/;
const mobileRegex = /^[6-9]\d{9}$/;
const safeTextRegex = /^[A-Za-z0-9 ,./()\-]*$/;
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

export const guestManagementSchema = z
  .object({
    /* ---------------- BASIC INFO ---------------- */

    guest_name: z
      .string()
      .min(1, "Guest name is required")
      .max(MAX_NAME_LENGTH, "Name too long")
      .regex(nameRegex, "Only letters, space and dot allowed"),

    guest_name_local_language: z.string().optional(),

    guest_mobile: z
      .string()
      .regex(mobileRegex, "Enter valid 10 digit mobile number"),

    guest_alternate_mobile: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === "") return true; // optional
          return mobileRegex.test(val);
        },
        {
          message: "Alternate mobile number must be 10 digits",
        }
      ),

    email: z.string().email("Invalid email address").optional(),

    guest_address: z
      .string()
      .max(MAX_ADDRESS_LENGTH, "Address too long")
      .regex(safeTextRegex, "Invalid characters in address")
      .transform(v => v.replace(/[\r\n]+/g, " "))
      .optional(),

    /* ---------------- DESIGNATION ---------------- */

    designation_id: z.string().optional(),

    designation_name: z
      .string()
      .regex(safeTextRegex, "Invalid characters in designation")
      .optional(),

    department: z.string().optional(),
    organization: z.string().optional(),
    office_location: z.string().optional(),

    /* ---------------- VISIT / IN-OUT ---------------- */

    entry_date: z
      .string()
      .regex(dateRegex, "Invalid date format (DD-MM-YYYY)"),

    entry_time: z
      .string()
      .regex(timeRegex, "Invalid time format (HH:mm)"),

    exit_date: z
      .string()
      .regex(dateRegex, "Invalid date format (DD-MM-YYYY)"),
      // .optional(),

    exit_time: z
      .string()
      .regex(timeRegex, "Invalid time format (HH:mm)"),
      // .optional(),

    status: z.enum(["Scheduled", "Entered", "Inside", "Exited", "Cancelled"]).optional(),
    purpose: z
      .string()
      .max(100, "Purpose too long")
      .regex(safeTextRegex, "Invalid characters in purpose")
      .optional(),
  })

  /* ======================================================
     CROSS-FIELD & BUSINESS RULES
  ====================================================== */

  .superRefine((data, ctx) => {
    const {
      guest_mobile,
      guest_alternate_mobile,
      designation_id,
      designation_name,
      department,
      organization,
      office_location,
      entry_date,
      // entry_time,
      exit_date,
      // exit_time,
    } = data;

    /* ---------- MOBILE RULES ---------- */

    if (
      guest_alternate_mobile &&
      guest_alternate_mobile === guest_mobile
    ) {
      ctx.addIssue({
        path: ["guest_alternate_mobile"],
        message: "Alternate number must be different",
        code: z.ZodIssueCode.custom,
      });
    }

    /* ---------- DESIGNATION RULES ---------- */

    const manualDesignationUsed =
      department || organization || office_location;

    if (manualDesignationUsed && !designation_name) {
      ctx.addIssue({
        path: ["designation_name"],
        message: "Designation Name is required",
        code: z.ZodIssueCode.custom,
      });
    }

    if (!designation_id && !designation_name) {
      ctx.addIssue({
        path: ["designation_name"],
        message: "Designation is required",
        code: z.ZodIssueCode.custom,
      });
    }
    if (data.exit_date && !data.exit_time) {
      ctx.addIssue({
        path: ["exit_time"],
        message: "Exit time is required when exit date is set",
        code: z.ZodIssueCode.custom,
      });
    }
    if (entry_date === new Date().toISOString().slice(0, 10)) {
      const now = new Date();
      const inDT = new Date(`${entry_date}T${data.entry_time}`);

      if (inDT < now) {
        ctx.addIssue({
      path: ["entry_time"],
      message: "Check-in time cannot be in the past",
      code: z.ZodIssueCode.custom,
    });
  }
}
    /* ---------- DATE RULES ---------- */

  //   const inDate = parseDate(entry_date);
  //   // const today = new Date();

  //   // if (inDate > today) {
  //   //   ctx.addIssue({
  //   //     path: ["entry_date"],
  //   //     message: "Future date not allowed",
  //   //     code: z.ZodIssueCode.custom,
  //   //   });
  //   // }

  //   const inYear = inDate.getFullYear();
  //   if (inYear < MIN_YEAR || inYear > MAX_YEAR) {
  //     ctx.addIssue({
  //       path: ["entry_date"],
  //       message: "Date outside allowed year range",
  //       code: z.ZodIssueCode.custom,
  //     });
  //   }

  //   if (exit_date) {
  //     const outDate = parseDate(exit_date);

  //     if (outDate < inDate) {
  //       ctx.addIssue({
  //         path: ["exit_date"],
  //         message: "Check-out cannot be before check-in",
  //         code: z.ZodIssueCode.custom,
  //       });
  //     }

  //     const stayDays = diffDays(inDate, outDate);
  //     if (stayDays > MAX_STAY_DAYS) {
  //       ctx.addIssue({
  //         path: ["exit_date"],
  //         message: "Stay period cannot exceed 90 days",
  //         code: z.ZodIssueCode.custom,
  //       });
  //     }
  //   }

  //   /* ---------- TIME ORDER RULE ---------- */

  //   if (exit_date && exit_time) {
  //     const inDT = new Date(`${entry_date}T${entry_time}`);
  //     const outDT = new Date(`${exit_date}T${exit_time}`);

  //     if (outDT <= inDT) {
  //       ctx.addIssue({
  //         path: ["exit_time"],
  //         message: "Exit time must be after entry time",
  //         code: z.ZodIssueCode.custom,
  //       });
  //     }
  //   }
  // })
      /* ---------- DATE RULES ---------- */

    const inDate = parseDate(entry_date);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ❌ past date not allowed
    if (inDate < today) {
      ctx.addIssue({
        path: ["entry_date"],
        message: "Check-in date cannot be before today",
        code: z.ZodIssueCode.custom,
      });
    }

    const inYear = inDate.getFullYear();
    if (inYear < MIN_YEAR || inYear > MAX_YEAR) {
      ctx.addIssue({
        path: ["entry_date"],
        message: "Date outside allowed year range",
        code: z.ZodIssueCode.custom,
      });
    }

    if (exit_date) {
      const outDate = parseDate(exit_date);

      if (outDate < inDate) {
        ctx.addIssue({
          path: ["exit_date"],
          message: "Check-out cannot be before check-in",
          code: z.ZodIssueCode.custom,
        });
      }

      const stayDays = diffDays(inDate, outDate);
      if (stayDays > MAX_STAY_DAYS) {
        ctx.addIssue({
          path: ["exit_date"],
          message: "Stay period cannot exceed 90 days",
          code: z.ZodIssueCode.custom,
        });
      }
    }
  })
  .refine(
    (data) => {
      if (!data.status || data.status === "Scheduled") return true;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const entry = new Date(data.entry_date);
      return entry <= today;
    },
    {
      message: "Future check-in allowed only for Scheduled guests",
      path: ["entry_date"],
    }
  );

/* ======================================================
   TYPE
====================================================== */

export type GuestManagementSchema = z.infer<
  typeof guestManagementSchema
>;
