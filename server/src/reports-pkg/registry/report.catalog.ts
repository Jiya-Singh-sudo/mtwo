import { ReportCode } from './report.registry';

export const REPORT_CATALOG = [
  {
    section: 'Guest Reports',
    reports: [
      {
        code: ReportCode.GUEST_DAILY_SUMMARY,
        title: 'Daily Guest Summary',
        description: 'Check-ins, check-outs, and current occupancy',
      },
      {
        code: ReportCode.GUEST_WEEKLY_SUMMARY,
        title: 'Weekly Guest Report',
        description: 'Week-wise guest statistics and trends',
      },
      {
        code: ReportCode.GUEST_MONTHLY_SUMMARY,
        title: 'Monthly Guest Report',
        description: 'Monthly visitor analysis by department',
      },
      {
        code: ReportCode.GUEST_CATEGORY_ANALYSIS,
        title: 'Guest Category Analysis',
        description: 'VIP, VVIP, and Official guest breakdown',
      },
    ],
  },

  {
    section: 'Room Reports',
    reports: [
      {
        code: ReportCode.ROOM_OCCUPANCY_TRENDS,
        title: 'Room Occupancy Trends',
        description: 'Daily, weekly, and monthly occupancy rates',
      },
      {
        code: ReportCode.ROOM_UTILIZATION,
        title: 'Room Utilization Report',
        description: 'Room-wise usage statistics',
      },
      {
        code: ReportCode.HOUSEKEEPING_PERFORMANCE,
        title: 'Housekeeping Performance',
        description: 'Cleaning schedules and completion rates',
      },
    ],
  },

  {
    section: 'Vehicle Reports',
    reports: [
      {
        code: ReportCode.VEHICLE_USAGE,
        title: 'Vehicle Usage Report',
        description: 'Fleet utilization and trip statistics',
      },
      {
        code: ReportCode.DRIVER_PERFORMANCE,
        title: 'Driver Performance Report',
        description: 'Driver duty hours and assignments',
      },
      {
        code: ReportCode.FUEL_MAINTENANCE,
        title: 'Fuel & Maintenance Report',
        description: 'Vehicle service and expense tracking',
      },
    ],
  },

  {
    section: 'Staff Reports',
    reports: [
      {
        code: ReportCode.DUTY_PERFORMANCE,
        title: 'Duty Performance Report',
        description: 'Staff duty completion and compliance',
      },
      {
        code: ReportCode.DEPARTMENT_WORKLOAD,
        title: 'Department Workload',
        description: 'Department-wise task distribution',
      },
      {
        code: ReportCode.STAFF_RESPONSE_TIME,
        title: 'Staff Response Time',
        description: 'Average response time analysis',
      },
    ],
  },

  {
    section: 'Notification Reports',
    reports: [
      {
        code: ReportCode.NOTIFICATION_LOGS,
        title: 'Notification Logs',
        description: 'Sent, delivered, and failed notifications',
      },
      {
        code: ReportCode.COMMUNICATION_ANALYTICS,
        title: 'Communication Analytics',
        description: 'Channel-wise communication statistics',
      },
    ],
  },

  {
    section: 'Food & Service Reports',
    reports: [
      {
        code: ReportCode.FOOD_SERVICE_UTILIZATION,
        title: 'Food Service Utilization',
        description: 'Food orders and service statistics',
      },
    ],
  },
];
