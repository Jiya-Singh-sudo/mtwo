import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ReportsPkgService } from './reports-pkg.service';
import { ReportPreviewDto } from './dto/report-preview.dto';
import { ReportGenerateDto } from './dto/report-generate.dto';

@Controller('reports-pkg')
export class ReportsPkgController {
  constructor(private readonly service: ReportsPkgService) {}

  /* ---------- DASHBOARD METRICS ---------- */
  @Get('metrics')
  getMetrics() {
    return this.service.getDashboardMetrics();
  }

  /* ---------- REPORT CATALOG ---------- */
  @Get('catalog')
  getCatalog() {
    return this.service.getCatalog();
  }

  /* ---------- PREVIEW ---------- */
  @Get('preview')
  preview(@Query() dto: ReportPreviewDto) {
    return this.service.previewReport(dto);
  }

  /* ---------- GENERATE ---------- */
  @Post('generate')
  generate(@Body() dto: ReportGenerateDto) {
    return this.service.generateReport(dto);
  }

  /* ---------- HISTORY ---------- */
  @Get('history')
  history() {
    return this.service.getHistory();
  }
}
