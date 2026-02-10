import { ReportCode } from '../registry/report.registry';
import { BadRequestException } from '@nestjs/common';

export function resolveNetworkReportCode(rangeType: string): ReportCode {
  switch (rangeType) {
    case 'Daily':
      return ReportCode.NETWORK_DAILY_SUMMARY;

    case 'Weekly':
      return ReportCode.NETWORK_WEEKLY_SUMMARY;

    case 'Monthly':
    case 'Custom Range':
      return ReportCode.NETWORK_MONTHLY_SUMMARY;

    default:
      throw new BadRequestException(
        `Unsupported range type for Network Report: ${rangeType}`
      );
  }
}
