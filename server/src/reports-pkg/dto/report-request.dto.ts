import { IsEnum, IsOptional } from 'class-validator';
import { ReportCode } from '../registry/report.registry';

export enum ReportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
}

export class ReportRequestDto {
  @IsEnum(ReportCode)
  reportCode: ReportCode;

  @IsEnum(ReportFormat)
  format: ReportFormat;

  @IsOptional()
  startDate?: string;

  @IsOptional()
  endDate?: string;
}
