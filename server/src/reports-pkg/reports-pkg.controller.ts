import { Controller, Get, Post, Body, Query, Req, Param } from '@nestjs/common';
import { ReportsPkgService } from './reports-pkg.service';
import { REPORT_CATALOG } from './registry/report.catalog';
import { ReportPreviewDto } from './dto/report-preview.dto';
import { ReportRequestDto } from './dto/report-request.dto';

@Controller('reports-pkg')
export class ReportsPkgController {
  constructor(private readonly reportsService: ReportsPkgService) {}

  /* ================= REPORT CATALOG ================= */

  @Get('catalog')
  getCatalog() {
    return REPORT_CATALOG;
  }

  /* ================= KPI METRICS ================= */

  @Get('metrics')
  getMetrics() {
    return this.reportsService.getDashboardMetrics();
  }

  /* ================= PREVIEW ================= */

  @Get('preview')
  previewReport(@Query() dto: ReportPreviewDto) {
    return this.reportsService.previewReport(dto.reportCode, dto);
  }

  /* ================= GENERATE ================= */

  @Post('generate')
  generateReport(@Body() dto: ReportRequestDto, @Req() req: any) {
    const userId = req?.user?.user_id ?? null;
    return this.reportsService.generateReport(dto, userId);
  }

  /* ================= HISTORY ================= */

  @Get('history')
  getHistory() {
    return this.reportsService.getGeneratedReports();
  }
  @Post('jobs')
    createJob(@Body() dto: ReportRequestDto, @Req() req: any) {
    return this.reportsService.createReportJob(
        dto,
        req?.user?.user_id ?? null,
    );
    }

    @Get('jobs/:jobId')
    getJob(@Param('jobId') jobId: string) {
    return this.reportsService.getReportJob(jobId);
    }

}
