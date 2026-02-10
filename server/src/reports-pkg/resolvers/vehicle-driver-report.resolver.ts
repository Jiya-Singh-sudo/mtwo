// server/src/reports-pkg/resolvers/vehicle-driver-report.resolver.ts

import { ReportCode } from '../registry/report.registry';
import { BadRequestException } from '@nestjs/common';

export function resolveVehicleDriverReportCode(
  rangeType: string
): ReportCode {
  switch (rangeType) {
    case 'Daily':
      return ReportCode.VEHICLE_DRIVER_DAILY_SUMMARY;

    case 'Weekly':
      return ReportCode.VEHICLE_DRIVER_WEEKLY_SUMMARY;

    case 'Monthly':
    case 'Custom Range':
      return ReportCode.VEHICLE_DRIVER_MONTHLY_SUMMARY;

    default:
      throw new BadRequestException(
        `Unsupported range type for Vehicle & Driver Report: ${rangeType}`
      );
  }
}
