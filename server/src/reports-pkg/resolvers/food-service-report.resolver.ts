import { ReportCode } from '../registry/report.registry';
import { BadRequestException } from '@nestjs/common';

export function resolveFoodServiceReportCode(rangeType: string): ReportCode {
  switch (rangeType) {
    case 'Daily':
      return ReportCode.FOOD_SERVICE_DAILY_SUMMARY;

    case 'Weekly':
      return ReportCode.FOOD_SERVICE_WEEKLY_SUMMARY;

    case 'Monthly':
    case 'Custom Range':
      return ReportCode.FOOD_SERVICE_MONTHLY_SUMMARY;

    default:
      throw new BadRequestException(
        `Unsupported range type for Food Service Report: ${rangeType}`
      );
  }
}
