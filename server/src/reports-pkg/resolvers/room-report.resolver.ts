import { ReportCode } from '../registry/report.registry';
import { BadRequestException } from '@nestjs/common';

export function resolveRoomSummaryReportCode(rangeType: string): ReportCode {
  switch (rangeType) {
    case 'Daily':
      return ReportCode.ROOM_DAILY_SUMMARY;

    case 'Weekly':
      return ReportCode.ROOM_WEEKLY_SUMMARY;

    case 'Monthly':
    case 'Custom Range':
      return ReportCode.ROOM_MONTHLY_SUMMARY;

    default:
      throw new BadRequestException(
        `Unsupported range type for Room Summary: ${rangeType}`,
      );
  }
}
