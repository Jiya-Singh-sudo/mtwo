import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReportCode } from './report-preview.dto';

export enum ReportFormat {
    PDF = 'PDF',
    EXCEL = 'EXCEL',
    CSV = 'CSV',
}

export class ReportGenerateDto {
    @IsEnum(ReportCode)
    reportCode: ReportCode;

    @IsEnum(ReportFormat)
    format: ReportFormat;

    @IsOptional()
    @IsString()
    fromDate?: string;

    @IsOptional()
    @IsString()
    toDate?: string;
}
