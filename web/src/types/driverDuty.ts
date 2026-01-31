export type DriverShift = 'morning' | 'afternoon' | 'night';

export interface DriverDuty {
  duty_id: string;

  driver_id: string;
  driver_name?: string; // present in joins / reports

  duty_date: string; // YYYY-MM-DD

  shift: DriverShift; 

  duty_in_time: string | null; // HH:mm:ss
  duty_out_time: string | null;

  is_week_off: boolean;
  repeat_weekly: boolean;
  is_active: boolean;

  created_at?: string;
  updated_at?: string;
}
export interface CreateDriverDutyPayload {
  driver_id: string;
  duty_date: string;
  shift: DriverShift;

  duty_in_time?: string;
  duty_out_time?: string;
  is_week_off?: boolean;
  repeat_weekly?: boolean;
}

export interface UpdateDriverDutyPayload {
  duty_date?: string;
  shift?: DriverShift;

  duty_in_time?: string | null;
  duty_out_time?: string | null;
  is_week_off?: boolean;
  repeat_weekly?: boolean;
}

export interface DriverWeeklyRow {
  driver_id: string;
  driver_name?: string;
  duties: Record<string, DriverDuty>;
}
