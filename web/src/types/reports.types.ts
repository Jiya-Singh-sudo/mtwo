/* ================= ENUMS ================= */

export enum ReportCode {
  GUEST_DAILY_SUMMARY = 'GUEST_DAILY_SUMMARY',
  GUEST_WEEKLY_SUMMARY = 'GUEST_WEEKLY_SUMMARY',
  GUEST_MONTHLY_SUMMARY = 'GUEST_MONTHLY_SUMMARY',
  GUEST_CATEGORY_ANALYSIS = 'GUEST_CATEGORY_ANALYSIS',

  ROOM_OCCUPANCY_TRENDS = 'ROOM_OCCUPANCY_TRENDS',
  ROOM_UTILIZATION = 'ROOM_UTILIZATION',
  HOUSEKEEPING_PERFORMANCE = 'HOUSEKEEPING_PERFORMANCE',

  VEHICLE_USAGE = 'VEHICLE_USAGE',
  DRIVER_PERFORMANCE = 'DRIVER_PERFORMANCE',

  DUTY_PERFORMANCE = 'DUTY_PERFORMANCE',
  DEPARTMENT_WORKLOAD = 'DEPARTMENT_WORKLOAD',

  NOTIFICATION_LOGS = 'NOTIFICATION_LOGS',

  FOOD_SERVICE_UTILIZATION = 'FOOD_SERVICE_UTILIZATION',
}

export enum ReportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
}

/* ================= DTOs ================= */

export interface ReportPreviewParams {
  reportCode: ReportCode;
  startDate?: string;
  endDate?: string;
}

export interface ReportGeneratePayload extends ReportPreviewParams {
  format: ReportFormat;
}

/* ================= JOB ================= */

export interface ReportJobResponse {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  file_path?: string;
  error_message?: string;
}

/* ================= METRICS ================= */

export interface DashboardMetrics {
  occupancyRate: number;
  vehicleUtilization: number;
  staffEfficiency: number;
  guestSatisfaction: number;
}
