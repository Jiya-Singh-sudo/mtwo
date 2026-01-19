import { ReportCode } from '@/types/reports.types';

export type UserRole =
    | 'ADMIN'
    | 'MANAGER'
    | 'STAFF'
    | 'VIEWER';

export const REPORT_ACCESS: Record<UserRole, ReportCode[]> = {
    ADMIN: [
        ReportCode.GUEST_DAILY_SUMMARY,
        ReportCode.GUEST_WEEKLY_SUMMARY,
        ReportCode.GUEST_MONTHLY_SUMMARY,
        ReportCode.GUEST_CATEGORY_ANALYSIS,
        ReportCode.ROOM_OCCUPANCY_TRENDS,
        ReportCode.ROOM_UTILIZATION,
        ReportCode.HOUSEKEEPING_PERFORMANCE,
        ReportCode.VEHICLE_USAGE,
        ReportCode.DRIVER_PERFORMANCE,
        ReportCode.DUTY_PERFORMANCE,
        ReportCode.DEPARTMENT_WORKLOAD,
        ReportCode.NOTIFICATION_LOGS,
        ReportCode.FOOD_SERVICE_UTILIZATION,
    ],

    MANAGER: [
        ReportCode.GUEST_DAILY_SUMMARY,
        ReportCode.GUEST_WEEKLY_SUMMARY,
        ReportCode.ROOM_OCCUPANCY_TRENDS,
        ReportCode.VEHICLE_USAGE,
        ReportCode.DUTY_PERFORMANCE,
    ],

    STAFF: [
        ReportCode.ROOM_OCCUPANCY_TRENDS,
        ReportCode.DUTY_PERFORMANCE,
    ],

    VIEWER: [
        ReportCode.GUEST_DAILY_SUMMARY,
    ],
};
