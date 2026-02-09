// server/src/reports-pkg/resolvers/guest-report.resolver.ts

import { ReportCode } from '../registry/report.registry';
import { BadRequestException } from '@nestjs/common';

export function resolveGuestSummaryReportCode(rangeType: string): ReportCode {
  switch (rangeType) {
    case 'Daily':
      return ReportCode.GUEST_DAILY_SUMMARY;

    case 'Weekly':
      return ReportCode.GUEST_WEEKLY_SUMMARY;

    case 'Monthly':
    case 'Custom Range':
      return ReportCode.GUEST_MONTHLY_SUMMARY;

    default:
      throw new BadRequestException(
        `Unsupported range type for Guest Summary: ${rangeType}`
      );
  }
}

