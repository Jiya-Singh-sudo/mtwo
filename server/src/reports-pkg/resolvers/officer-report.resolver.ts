import { ReportCode } from '../registry/report.registry';
import { BadRequestException } from '@nestjs/common';

export function resolveOfficerReportCode(rangeType: string): ReportCode {
  switch (rangeType) {
    case 'Daily':
      return ReportCode.OFFICER_DAILY_SUMMARY;

    case 'Weekly':
      return ReportCode.OFFICER_WEEKLY_SUMMARY;

    case 'Monthly':
    case 'Custom Range':
      return ReportCode.OFFICER_MONTHLY_SUMMARY;

    default:
      throw new BadRequestException(
        `Unsupported range type for Officer Report: ${rangeType}`
      );
  }
}
