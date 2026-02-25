import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReportCodePrev } from './report-preview.dto';

export enum ReportFormat {
    PDF = 'PDF',
    EXCEL = 'EXCEL',
    CSV = 'CSV',
}

export class ReportGenerateDto {
    @IsEnum(ReportCodePrev)
    reportCode: ReportCodePrev;

    @IsEnum(ReportFormat)
    format: ReportFormat;

    @IsOptional()
    @IsString()
    fromDate?: string;

    @IsOptional()
    @IsString()
    toDate?: string;

    
}
