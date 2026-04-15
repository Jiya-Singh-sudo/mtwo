export enum ReportCode {
  GUEST_SUMMARY = 'GUEST_SUMMARY',
  GUEST_DAILY_SUMMARY = 'GUEST_DAILY_SUMMARY',
  GUEST_WEEKLY_SUMMARY = 'GUEST_WEEKLY_SUMMARY',
  GUEST_MONTHLY_SUMMARY = 'GUEST_MONTHLY_SUMMARY',
  GUEST_CATEGORY_ANALYSIS = 'GUEST_CATEGORY_ANALYSIS',
  ROOM_OCCUPANCY = 'ROOM_OCCUPANCY',
  ROOM_OCCUPANCY_TREND = 'ROOM_OCCUPANCY_TREND',
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
  CSV = 'CSV',
}

export interface DashboardMetrics {
  occupancyRate: number;
  vehicleUtilization: number;
  staffEfficiency: number;
  guestSatisfaction: number;
}

export interface GeneratedReport {
  report_id: string;
  report_name: string;
  report_type: string;
  generated_at: string;
  file_path: string;
}

export type ReportPreviewParams = {
  reportCode: ReportCode;
  fromDate?: string;
  toDate?: string;
};

export type ReportJobResponse = {
  job_id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  progress?: number;
  resultUrl?: string;
  errorMessage?: string;
};
