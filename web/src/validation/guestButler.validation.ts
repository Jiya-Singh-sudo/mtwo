import { z } from "zod";

/* ======================================================
   CONSTANTS
====================================================== */

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
const MAX_REMARKS_LENGTH = 500;
const safeTextRegex = /^[A-Za-z0-9 ,./()\-]*$/;

/* ======================================================
   HELPERS
====================================================== */

const parseDateTime = (d?: string, t?: string) =>
  d && t ? new Date(`${d}T${t}`) : null;

/* ======================================================
   MAIN SCHEMA
====================================================== */

export const guestButlerSchema = z
  .object({
    guest_id: z.string().min(1, "Guest is required"),
    butler_id: z.string().min(1, "Butler is required"),
    room_id: z.string().optional(),

    check_in_date: z.string().regex(dateRegex).optional(),
    check_in_time: z.string().regex(timeRegex).optional(),

    check_out_date: z.string().regex(dateRegex).optional(),
    check_out_time: z.string().regex(timeRegex).optional(),

    service_type: z.string().min(1, "Service type is required"),
    service_description: z.string().optional(),

    service_date: z.string().regex(dateRegex).optional(),
    service_time: z.string().regex(timeRegex).optional(),

    remarks: z
      .string()
      .max(MAX_REMARKS_LENGTH, "Remarks too long")
      .regex(safeTextRegex, "Invalid characters in remarks")
      .optional(),

    is_active: z.boolean().optional(),
  })

  /* ======================================================
     CROSS-FIELD RULES
  ====================================================== */

  .superRefine((data, ctx) => {
    const inDT = parseDateTime(data.check_in_date, data.check_in_time);
    const outDT = parseDateTime(data.check_out_date, data.check_out_time);

    if (inDT && outDT && outDT <= inDT) {
      ctx.addIssue({
        path: ["check_out_time"],
        message: "Check-out must be after check-in",
        code: z.ZodIssueCode.custom,
      });
    }
  });

/* ======================================================
   TYPE
====================================================== */

export type GuestButlerSchema = z.infer<
  typeof guestButlerSchema
>;
