import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ReportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
}

export enum ReportType {
  GUEST_SUMMARY = 'GUEST_SUMMARY',
  ROOM_OCCUPANCY = 'ROOM_OCCUPANCY',
  VEHICLE_USAGE = 'VEHICLE_USAGE',
  STAFF_PERFORMANCE = 'STAFF_PERFORMANCE',
}

export class GenerateReportDto {
  @IsEnum(ReportType)
  reportType: ReportType;

  @IsEnum(ReportFormat)
  format: ReportFormat;

  @IsOptional()
  @IsString()
  period?: 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';

  @IsOptional()
  startDate?: string;

  @IsOptional()
  endDate?: string;
}
