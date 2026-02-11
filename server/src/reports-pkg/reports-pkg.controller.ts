import { Controller, Get, Post, Query, Body, Res, HttpException, HttpStatus } from '@nestjs/common';
import express from 'express';
import { ReportsPkgService } from './reports-pkg.service';
import { ReportPreviewDto } from './dto/report-preview.dto';
import { ReportGenerateDto } from './dto/report-generate.dto';
import { normalizeRangeType } from './utils/range-normalizer.util';
import type { Response } from 'express';
import { ReportCode } from './registry/report.registry';

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
  /* ---------- VEHICLE & DRIVER TRANSACTION EXCEL ---------- */
  @Post('vehicle-driver/excel')
  async generateVehicleDriverExcel(
    @Body()
    body: {
      rangeType?: string;
      startDate?: string;
      endDate?: string;
    },
    @Res() res: express.Response
  ) {
    try {
      console.log('[Vehicle Driver Excel RAW BODY]', body);

      const normalizedBody = {
        ...body,
        rangeType: normalizeRangeType(body.rangeType),
      };

      console.log('[Vehicle Driver Excel NORMALIZED BODY]', normalizedBody);

      const result =
        await this.service.generateVehicleDriverExcel(normalizedBody);

      if (!result?.filePath) {
        throw new HttpException(
          'Failed to generate Vehicle & Driver Excel report',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return res.download(result.filePath);
    } catch (error) {
      console.error('Vehicle Driver Excel Error:', error.message);

      throw new HttpException(
        error.message || 'Vehicle & Driver Excel generation failed',
        HttpStatus.BAD_REQUEST
      );
    }
  }
  /* ---------- VEHICLE & DRIVER TRANSACTION PDF ---------- */
  @Post('vehicle-driver/pdf')
  async generateVehicleDriverPdf(
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
        await this.service.generateVehicleDriverPdf(normalizedBody);

      if (!result?.filePath) {
        throw new HttpException(
          'Failed to generate Vehicle & Driver PDF report',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return res.download(result.filePath);
    } catch (error) {
      console.error('Vehicle Driver PDF Error:', error.message);

      throw new HttpException(
        error.message || 'Vehicle & Driver PDF generation failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  /* ---------- FOOD SERVICE TRANSACTION EXCEL ---------- */
  @Post('food-service/excel')
  async generateFoodServiceExcel(
    @Body()
    body: {
      rangeType?: string;
      startDate?: string;
      endDate?: string;
    },
    @Res() res: express.Response
  ) {
    try {
      console.log('[Food Service Excel RAW BODY]', body);

      const normalizedBody = {
        ...body,
        rangeType: normalizeRangeType(body.rangeType),
      };

      console.log('[Food Service Excel NORMALIZED BODY]', normalizedBody);

      const result =
        await this.service.generateFoodServiceExcel(normalizedBody);

      if (!result?.filePath) {
        throw new HttpException(
          'Failed to generate Food Service Excel report',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return res.download(result.filePath);
    } catch (error) {
      console.error('Food Service Excel Error:', error.message);

      throw new HttpException(
        error.message || 'Food Service Excel generation failed',
        HttpStatus.BAD_REQUEST
      );
    }
  }
  /* ---------- FOOD SERVICE TRANSACTION PDF ---------- */
  @Post('food-service/pdf')
  async generateFoodServicePdf(
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
        await this.service.generateFoodServicePdf(normalizedBody);

      if (!result?.filePath) {
        throw new HttpException(
          'Failed to generate Food Service PDF report',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return res.download(result.filePath);
    } catch (error) {
      console.error('Food Service PDF Error:', error.message);

      throw new HttpException(
        error.message || 'Food Service PDF generation failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  /* ---------- NETWORK TRANSACTION EXCEL ---------- */
  @Post('network/excel')
  async generateNetworkExcel(
    @Body()
    body: {
      rangeType?: string;
      startDate?: string;
      endDate?: string;
    },
    @Res() res: express.Response
  ) {
    try {
      console.log('[Network Excel RAW BODY]', body);

      const normalizedBody = {
        ...body,
        rangeType: normalizeRangeType(body.rangeType),
      };

      console.log('[Network Excel NORMALIZED BODY]', normalizedBody);

      const result =
        await this.service.generateNetworkExcel(normalizedBody);

      if (!result?.filePath) {
        throw new HttpException(
          'Failed to generate Network Excel report',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return res.download(result.filePath);
    } catch (error) {
      console.error('Network Excel Error:', error.message);

      throw new HttpException(
        error.message || 'Network Excel generation failed',
        HttpStatus.BAD_REQUEST
      );
    }
  }
  /* ---------- NETWORK TRANSACTION PDF ---------- */
  @Post('network/pdf')
  async generateNetworkPdf(
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
        await this.service.generateNetworkPdf(normalizedBody);

      if (!result?.filePath) {
        throw new HttpException(
          'Failed to generate Network PDF report',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return res.download(result.filePath);
    } catch (error) {
      console.error('Network PDF Error:', error.message);

      throw new HttpException(
        error.message || 'Network PDF generation failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  /* ---------- DRIVER DUTY TRANSACTION EXCEL ---------- */
  @Post('driver-duty/excel')
  async generateDriverDutyExcel(
    @Body()
    body: {
      rangeType?: string;
      startDate?: string;
      endDate?: string;
    },
    @Res() res: express.Response
  ) {
    try {
      const normalizedBody = {
        ...body,
        rangeType: normalizeRangeType(body.rangeType),
      };

      const result =
        await this.service.generateDriverDutyExcel(normalizedBody);

      if (!result?.filePath) {
        throw new HttpException(
          'Failed to generate Driver Duty Excel report',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return res.download(result.filePath);
    } catch (error) {
      console.error('Driver Duty Excel Error:', error.message);

      throw new HttpException(
        error.message || 'Driver Duty Excel generation failed',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /* ---------- DRIVER DUTY TRANSACTION PDF ---------- */
  @Post('driver-duty/pdf')
  async generateDriverDutyPdf(
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
        await this.service.generateDriverDutyPdf(normalizedBody);

      if (!result?.filePath) {
        throw new HttpException(
          'Failed to generate Driver Duty PDF report',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return res.download(result.filePath);
    } catch (error) {
      console.error('Driver Duty PDF Error:', error.message);

      throw new HttpException(
        error.message || 'Driver Duty PDF generation failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  /* ---------- GENERIC VIEW ---------- */
  // @Post('view')
  // async viewReport(
  //   @Body()
  //   body: {
  //     reportCode: ReportCode;
  //     rangeType: string;
  //     startDate?: string;
  //     endDate?: string;
  //   },
  // ) {
  //   try {
  //     const normalizedBody = {
  //       ...body,
  //       rangeType: normalizeRangeType(body.rangeType),
  //     };

  //     return await this.service.viewReport(normalizedBody);
  //   } catch (error) {
  //     throw new HttpException(
  //       error.message || 'View report failed',
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   }
  // }
  /* ---------- GENERIC VIEW ---------- */
  @Post('view')
  async viewReport(
    @Body()
    body: {
      section: 'guest' | 'room' | 'vehicle' | 'driver-duty' | 'food' | 'network';
      rangeType: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    try {
      const normalizedBody = {
        ...body,
        rangeType: normalizeRangeType(body.rangeType),
      };

      return await this.service.viewReport(normalizedBody);
    } catch (error) {
      throw new HttpException(
        error.message || 'View report failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  @Post('generate')
  async generateSectionReport(
    @Body()
    body: {
      section: 'guest' | 'room' | 'vehicle' | 'driver-duty' | 'food' | 'network';
      rangeType: string;
      format: 'PDF' | 'EXCEL' | 'VIEW';
      startDate?: string;
      endDate?: string;
    },
    @Res() res: Response,
  ) {
    const normalizedBody = {
      ...body,
      rangeType: normalizeRangeType(body.rangeType),
    };

    const result = await this.service.generateReportGeneric(normalizedBody);

    if (body.format === 'VIEW') {
      return result;
    }

    if (!('filePath' in result) || !result.filePath) {
      throw new HttpException(
        'Failed to generate report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return res.download(result.filePath);
  }


}
