import { Controller, Get, Post, Query, Body, Res, HttpException, HttpStatus } from '@nestjs/common';
import express from 'express';
import { ReportsPkgService } from './reports-pkg.service';
import { ReportPreviewDto } from './dto/report-preview.dto';
import { ReportGenerateDto } from './dto/report-generate.dto';
import { normalizeRangeType } from './utils/range-normalizer.util';
import type { Response } from 'express';

@Controller('reports-pkg')
export class ReportsPkgController {
  constructor(private readonly service: ReportsPkgService) { }

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
  /* ---------- GUSET SUMMARY EXCEL ---------- */
  @Post('guest-summary/excel')
  async generateGuestSummaryExcel(
    @Body()
    body: {
      rangeType?: string;
      startDate?: string;
      endDate?: string;
    },
    @Res() res: express.Response
  ) {
    try {
      console.log('[Guest Excel RAW BODY]', body);

      const normalizedBody = {
        ...body,
        rangeType: normalizeRangeType(body.rangeType),
      };

      console.log('[Guest Excel NORMALIZED BODY]', normalizedBody);

      const result =
        await this.service.generateGuestSummaryExcel(normalizedBody);

      if (!result?.filePath) {
        throw new HttpException(
          'Failed to generate Excel report',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return res.download(result.filePath);
    } catch (error) {
      console.error('Guest Summary Excel Error:', error.message);
      throw new HttpException(
        error.message || 'Report generation failed',
        HttpStatus.BAD_REQUEST
      );
    }
  }
  /* ---------- GUEST SUMMARY PDF ---------- */
  @Post('guest-summary/pdf')
  async generateGuestSummaryPdf(
    @Body()
    body: {
      rangeType: string;
      startDate?: string;
      endDate?: string;
    },
    @Res() res: express.Response,
  ) {
    try {
      const result =
        await this.service.generateGuestSummaryPdf(body);

      if (!result?.filePath) {
        throw new HttpException(
          'Failed to generate Guest Summary PDF',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return res.download(result.filePath);
    } catch (error) {
      console.error('Guest Summary PDF Error:', error);

      throw new HttpException(
        error.message || 'Guest Summary PDF generation failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  /* =====================================================
   ROOM & HOUSEKEEPING – EXCEL -PDF
  ===================================================== */

  @Post('room-summary/excel')
  async generateRoomSummaryExcel(
    @Body()
    body: {
      rangeType: string;
      startDate?: string;
      endDate?: string;
    },
    @Res() res: express.Response,
  ) {
    try {
      console.log('[Room Excel RAW BODY]', body);

      const normalizedBody = {
        ...body,
        rangeType: normalizeRangeType(body.rangeType),
      };

      console.log('[Room Excel NORMALIZED BODY]', normalizedBody);

      const result =
        await this.service.generateRoomOccupancyExcel(normalizedBody);

      if (!result?.filePath) {
        throw new HttpException(
          'Failed to generate Room Excel report',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return res.download(result.filePath);
    } catch (error) {
      console.error('Room Excel Error:', error.message);

      throw new HttpException(
        error.message || 'Room report generation failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  @Post('room-summary/pdf')
  async generateRoomSummaryPdf(
    @Body()
    body: {
      rangeType: string;
      startDate?: string;
      endDate?: string;
    },
    @Res() res: Response,
  ) {
    try {
      const normalizedBody = {
        ...body,
        rangeType: normalizeRangeType(body.rangeType),
      };

      const result =
        await this.service.generateRoomSummaryPdf(normalizedBody);

      if (!result?.filePath) {
        throw new HttpException(
          'Failed to generate Room PDF report',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return res.download(result.filePath);
    } catch (error) {
      console.error('Room PDF Error:', error.message);

      throw new HttpException(
        error.message || 'Room PDF generation failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

}
