/* =========================================================
   DRIVER DUTY ROASTER TYPES
   ========================================================= */

/* ---------- ENUMS ---------- */

export type DriverShift = "morning" | "afternoon" | "night";

/* ---------- MAIN ENTITY ---------- */

export interface DriverDutyRoaster {
  roaster_id: string;

  driver_id: string;
  shift: DriverShift;

  // Sunday
  sunday_duty_in_time?: string | null;   // HH:mm
  sunday_duty_out_time?: string | null;  // HH:mm
  sunday_week_off: boolean;

  // Monday
  monday_duty_in_time?: string | null;
  monday_duty_out_time?: string | null;
  monday_week_off: boolean;

  // Tuesday
  tuesday_duty_in_time?: string | null;
  tuesday_duty_out_time?: string | null;
  tuesday_week_off: boolean;

  // Wednesday
  wednesday_duty_in_time?: string | null;
  wednesday_duty_out_time?: string | null;
  wednesday_week_off: boolean;

  // Thursday
  thursday_duty_in_time?: string | null;
  thursday_duty_out_time?: string | null;
  thursday_week_off: boolean;

  // Friday
  friday_duty_in_time?: string | null;
  friday_duty_out_time?: string | null;
  friday_week_off: boolean;

  // Saturday
  saturday_duty_in_time?: string | null;
  saturday_duty_out_time?: string | null;
  saturday_week_off: boolean;

  is_active: boolean;

  inserted_at: string;
  inserted_by?: string | null;
  inserted_ip?: string | null;

  updated_at?: string | null;
  updated_by?: string | null;
  updated_ip?: string | null;
}

/* ---------- CREATE DTO ---------- */

export interface DriverDutyRoasterCreateDto {
  driver_id: string;
  shift: DriverShift;

  sunday_duty_in_time?: string;
  sunday_duty_out_time?: string;
  sunday_week_off: boolean;

  monday_duty_in_time?: string;
  monday_duty_out_time?: string;
  monday_week_off: boolean;

  tuesday_duty_in_time?: string;
  tuesday_duty_out_time?: string;
  tuesday_week_off: boolean;

  wednesday_duty_in_time?: string;
  wednesday_duty_out_time?: string;
  wednesday_week_off: boolean;

  thursday_duty_in_time?: string;
  thursday_duty_out_time?: string;
  thursday_week_off: boolean;

  friday_duty_in_time?: string;
  friday_duty_out_time?: string;
  friday_week_off: boolean;

  saturday_duty_in_time?: string;
  saturday_duty_out_time?: string;
  saturday_week_off: boolean;
}

/* ---------- UPDATE DTO ---------- */

export interface DriverDutyRoasterUpdateDto {
  shift?: DriverShift;

  sunday_duty_in_time?: string | null;
  sunday_duty_out_time?: string | null;
  sunday_week_off?: boolean;

  monday_duty_in_time?: string | null;
  monday_duty_out_time?: string | null;
  monday_week_off?: boolean;

  tuesday_duty_in_time?: string | null;
  tuesday_duty_out_time?: string | null;
  tuesday_week_off?: boolean;

  wednesday_duty_in_time?: string | null;
  wednesday_duty_out_time?: string | null;
  wednesday_week_off?: boolean;

  thursday_duty_in_time?: string | null;
  thursday_duty_out_time?: string | null;
  thursday_week_off?: boolean;

  friday_duty_in_time?: string | null;
  friday_duty_out_time?: string | null;
  friday_week_off?: boolean;

  saturday_duty_in_time?: string | null;
  saturday_duty_out_time?: string | null;
  saturday_week_off?: boolean;

  is_active?: boolean;
}
