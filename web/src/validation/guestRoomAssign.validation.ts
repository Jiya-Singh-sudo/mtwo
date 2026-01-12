import { z } from "zod";

/* ================= HELPERS ================= */

const parseDate = (d: string) => new Date(`${d}T00:00:00`);

const diffDays = (a: Date, b: Date) =>
  Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

/* ================= SCHEMA ================= */

export const guestRoomAssignSchema = z
  .object({
    guest_id: z.string().min(1, "Guest is required"),
    room_id: z.string().min(1, "Room is required"),

    check_in_date: z.string().min(1, "Check-in date required"),

    check_out_date: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.check_out_date) {
      const inDate = parseDate(data.check_in_date);
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

export type GuestRoomAssignSchema = z.infer<
  typeof guestRoomAssignSchema
>;
