import { ReportCode } from '../registry/report.registry';
import { BadRequestException } from '@nestjs/common';

export function resolveDriverDutyReportCode(
  rangeType: string
): ReportCode {
  switch (rangeType) {
    case 'Daily':
      return ReportCode.DRIVER_DUTY_DAILY_SUMMARY;

    case 'Weekly':
      return ReportCode.DRIVER_DUTY_WEEKLY_SUMMARY;

    case 'Monthly':
    case 'Custom Range':
      return ReportCode.DRIVER_DUTY_MONTHLY_SUMMARY;

    default:
      throw new BadRequestException(
        `Unsupported range type for Driver Duty Report: ${rangeType}`
      );
  }
}
