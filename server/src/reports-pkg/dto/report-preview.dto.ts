import { IsEnum, IsOptional } from 'class-validator';
import { ReportCode } from '../registry/report.registry';

export class ReportPreviewDto {
  @IsEnum(ReportCode)
  reportCode: ReportCode;

  @IsOptional()
  startDate?: string;

  @IsOptional()
  endDate?: string;
}
