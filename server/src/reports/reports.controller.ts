import { Controller, Get, Post, Body, Query, Param, Req } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';

@Controller('reports')
export class ReportsController {
    constructor(private readonly service: ReportsService) { }

    /* ================= KPIs ================= */

    @Get('metrics')
    getDashboardMetrics() {
        return this.service.getDashboardMetrics();
    }

    /* ============ Generate Report (Sync) ============ */

    @Post('generate')
    generateReport(@Body() dto: GenerateReportDto) {
        return this.service.generateReport(dto);
    }

    /* ============ View Report Data ============ */

    @Get('preview')
    previewReport(@Query('type') type: string, @Query() filters: any) {
        return this.service.previewReport(type, filters);
    }

    /* ============ History ==================== */

    @Get('history')
    getGeneratedReports() {
        return this.service.getGeneratedReports();
    }

    /* ============ Job-based Generation ============ */

    @Post('jobs')
    async createReportJob(@Body() dto: GenerateReportDto, @Req() req: any) {
        return this.service.createReportJob(dto, req.user?.user_id || 'unknown');
    }

    @Get('jobs/:jobId')
    getJobStatus(@Param('jobId') jobId: string) {
        return this.service.getJobStatus(jobId);
    }

    @Get('download/:jobId')
    downloadReport(@Param('jobId') jobId: string) {
        return this.service.downloadReport(jobId);
    }
}
