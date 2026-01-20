export enum ReportCode {
  GUEST_SUMMARY = 'GUEST_SUMMARY',
  ROOM_OCCUPANCY = 'ROOM_OCCUPANCY',
  ROOM_OCCUPANCY_TREND = 'ROOM_OCCUPANCY_TREND',
  VEHICLE_USAGE = 'VEHICLE_USAGE',
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
