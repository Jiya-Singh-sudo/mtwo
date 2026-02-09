import { ReportCode } from './report.registry';

export const REPORT_CATALOG = [
  {
    section: 'Guest Reports',
    reports: [
      {
        code: ReportCode.GUEST_DAILY_SUMMARY,
        title: 'Daily Guest Summary',
        description: 'Guests present today with stay details',
      },
      {
        code: ReportCode.GUEST_WEEKLY_SUMMARY,
        title: 'Weekly Guest Summary',
        description: 'Guests present during the current week',
      },
      {
        code: ReportCode.GUEST_MONTHLY_SUMMARY,
        title: 'Monthly Guest Summary',
        description: 'Guests present during the current month',
      },
    ],
  },

  {
    section: 'Room Reports',
    reports: [
      {
        code: ReportCode.ROOM_DAILY_SUMMARY,
        title: 'Daily Room Summary',
        description: 'Room occupancy status for today',
      },
      {
        code: ReportCode.ROOM_WEEKLY_SUMMARY,
        title: 'Weekly Room Summary',
        description: 'Room usage across the current week',
      },
      {
        code: ReportCode.ROOM_MONTHLY_SUMMARY,
        title: 'Monthly Room Summary',
        description: 'Room occupancy for the current month',
      },
    ],
  },

  {
    section: 'Vehicle Reports',
    reports: [
      {
        code: ReportCode.VEHICLE_DRIVER_DAILY_SUMMARY,
        title: 'Daily Vehicle Summary',
        description: 'Vehicle usage for today',
      },
      {
        code: ReportCode.VEHICLE_DRIVER_WEEKLY_SUMMARY,
        title: 'Weekly Vehicle Summary',
        description: 'Vehicle usage during the week',
      },
      {
        code: ReportCode.VEHICLE_DRIVER_MONTHLY_SUMMARY,
        title: 'Monthly Vehicle Summary',
        description: 'Vehicle usage during the month',
      },
    ],
  },

  {
    section: 'Driver Duty Reports',
    reports: [
      {
        code: ReportCode.DRIVER_DUTY_DAILY_SUMMARY,
        title: 'Daily Driver Duty Summary',
        description: 'Driver duty assignments for today',
      },
      {
        code: ReportCode.DRIVER_DUTY_WEEKLY_SUMMARY,
        title: 'Weekly Driver Duty Summary',
        description: 'Driver duty assignments for the week',
      },
      {
        code: ReportCode.DRIVER_DUTY_MONTHLY_SUMMARY,
        title: 'Monthly Driver Duty Summary',
        description: 'Driver duty assignments for the month',
      },
    ],
  },

  {
    section: 'Food Service Reports',
    reports: [
      {
        code: ReportCode.FOOD_SERVICE_DAILY_SUMMARY,
        title: 'Daily Food Service Summary',
        description: 'Food services provided today',
      },
      {
        code: ReportCode.FOOD_SERVICE_WEEKLY_SUMMARY,
        title: 'Weekly Food Service Summary',
        description: 'Food services during the week',
      },
      {
        code: ReportCode.FOOD_SERVICE_MONTHLY_SUMMARY,
        title: 'Monthly Food Service Summary',
        description: 'Food services during the month',
      },
    ],
  },

  {
    section: 'Network Reports',
    reports: [
      {
        code: ReportCode.NETWORK_DAILY_SUMMARY,
        title: 'Daily Network Summary',
        description: 'Network usage for today',
      },
      {
        code: ReportCode.NETWORK_WEEKLY_SUMMARY,
        title: 'Weekly Network Summary',
        description: 'Network usage during the week',
      },
      {
        code: ReportCode.NETWORK_MONTHLY_SUMMARY,
        title: 'Monthly Network Summary',
        description: 'Network usage during the month',
      },
    ],
  },
];
