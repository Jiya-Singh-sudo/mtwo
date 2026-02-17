import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ReportPreviewDto, ReportCodePrev } from './dto/report-preview.dto';
import { ReportCode } from './registry/report.registry';
import { ReportGenerateDto, ReportFormat } from './dto/report-generate.dto';
import { v4 as uuid } from 'uuid';
import { generatePdfFromHtml } from '../../common/utlis/pdf/pdf.utils';
import { generateCsv } from '../../common/utlis/csv.util';
import { resolveDateRange } from './resolvers/date-range.resolver';
import { resolveGuestSummaryReportCode } from './resolvers/guest-report.resolver';
import { GuestReportEngine } from './engines/guest.engine';
import { exportGuestSummaryExcel } from './exporters/guest.excel.exporter';
import * as path from 'path';
import { generatePdfFromTemplate } from '../../common/utlis/pdf/playwright-pdf.util';
import { RoomReportEngine } from './engines/room.engine';
import { exportRoomOccupancyExcel } from './exporters/room.excel.exporter';
import { resolveRoomSummaryReportCode } from './resolvers/room-report.resolver';
import { VehicleDriverReportEngine } from './engines/vehicle-driver.engine';
import { exportVehicleDriverExcel } from './exporters/vehicle-driver.excel.exporter';
import { resolveVehicleDriverReportCode } from './resolvers/vehicle-driver-report.resolver';
import { FoodServiceReportEngine } from './engines/food-service.engine';
import { exportFoodServiceExcel } from './exporters/food-service.excel.exporter';
import { resolveFoodServiceReportCode } from './resolvers/food-service-report.resolver';
import { NetworkReportEngine } from './engines/network.engine';
import { exportNetworkExcel } from './exporters/network.excel.exporter';
import { resolveNetworkReportCode } from './resolvers/network-report.resolver';
import { DriverDutyReportEngine } from './engines/driver-duty.engine';
import { exportDriverDutyExcel } from './exporters/driver-duty.excel.exporter';
import { resolveDriverDutyReportCode } from './resolvers/driver-duty-report.resolver';


@Injectable()
export class ReportsPkgService {
  constructor(private readonly db: DatabaseService) { }

  /* ================= METRICS ================= */

  async getDashboardMetrics() {
    const roomsResult = await this.db.query(`
      SELECT
        ROUND(
          COUNT(CASE WHEN status = 'Occupied' THEN 1 END)::decimal
          / NULLIF(COUNT(*),0) * 100
        ) AS occupancy_rate
      FROM m_rooms
      WHERE is_active = true
    `);
    const rooms = roomsResult?.[0];

    const vehiclesResult = await this.db.query(`
      SELECT
        ROUND(
          COUNT(*)::decimal
          / NULLIF((SELECT COUNT(*) FROM m_vehicle WHERE is_active = true),0)
          * 100
        ) AS vehicle_utilization
      FROM t_guest_driver
      WHERE is_active = true
    `);
    const vehicles = vehiclesResult?.[0];

    return {
      occupancyRate: Number(rooms?.occupancy_rate ?? 0),
      vehicleUtilization: Number(vehicles?.vehicle_utilization ?? 0),
      staffEfficiency: 85,
      guestSatisfaction: 92,
    };
  }

  /* ================= CATALOG ================= */

  getCatalog() {
    return [
      {
        category: 'Guest Reports',
        reports: [
          {
            code: ReportCodePrev.GUEST_SUMMARY,
            title: 'Guest Summary',
            description: 'Check-in, check-out and stay details',
          },
        ],
      },
      {
        category: 'Room Reports',
        reports: [
          {
            code: ReportCodePrev.ROOM_OCCUPANCY,
            title: 'Room Occupancy',
            description: 'Room-wise occupancy status',
          },
          {
            code: ReportCodePrev.ROOM_OCCUPANCY_TREND,
            title: 'Room Occupancy Trend',
            description: 'Daily occupied rooms over time',
          },
        ],
      },
      {
        category: 'Vehicle Reports',
        reports: [
          {
            code: ReportCodePrev.VEHICLE_USAGE,
            title: 'Vehicle Usage',
            description: 'Trips and assignments per vehicle',
          },
        ],
      },
    ];
  }

  /* ================= PREVIEW ================= */

  async previewReport(dto: ReportPreviewDto) {
    const fromDate = dto.fromDate
      ? dto.fromDate
      : new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

    const toDate = dto.toDate
      ? dto.toDate
      : new Date().toISOString().slice(0, 10);



    switch (dto.reportCode) {
      case ReportCodePrev.GUEST_SUMMARY:
        return this.db.query(
          `
          SELECT
            g.guest_name,
            r.room_no,
            gr.check_in_date,
            gr.check_out_date
          FROM t_guest_room gr
          JOIN m_guest g ON g.guest_id = gr.guest_id
          LEFT JOIN m_rooms r ON r.room_id = gr.room_id
          WHERE gr.is_active = true
            AND gr.check_in_date >= $1
            AND gr.check_in_date < ($2::date + INTERVAL '1 day')
          ORDER BY gr.check_in_date DESC
        `,
          [fromDate, toDate],
        );

      case ReportCodePrev.ROOM_OCCUPANCY:
        return this.db.query(`
          SELECT
            status AS label,
            COUNT(*)::int AS value
          FROM m_rooms
          WHERE is_active = true
          GROUP BY status
        `);

      case ReportCodePrev.VEHICLE_USAGE:
        return this.db.query(
          `
    SELECT
      vehicle_no,
      COUNT(*) AS trips
    FROM t_guest_driver
    WHERE is_active = true
      AND trip_date >= $1
      AND trip_date < ($2::date + INTERVAL '1 day')
    GROUP BY vehicle_no
    ORDER BY trips DESC
  `,
          [fromDate, toDate],
        );


      case ReportCodePrev.ROOM_OCCUPANCY_TREND:
        return this.db.query(
          `
          SELECT
            DATE(gr.check_in_date) AS date,
            COUNT(*) AS count
          FROM t_guest_room gr
          JOIN m_rooms r ON r.room_id = gr.room_id
          WHERE gr.check_in_date <= $2
            AND (gr.check_out_date IS NULL OR gr.check_out_date >= $1)
          GROUP BY DATE(gr.check_in_date)
          ORDER BY date
        `,
          [fromDate, toDate],
        );

      default:
        return [];
    }
  }

  /* ================= GENERATE ================= */

  async generateReport(dto: ReportGenerateDto) {
    return this.db.transaction(async (client) => {
      const data = await this.previewReport(dto);
      if (!Array.isArray(data) || data.length === 0) {
        return {
          filePath: null,
          message: 'No data available for selected filters',
        };
      }
      const fileName = `${dto.reportCode}-${Date.now()}`;

      let filePath = '';

      if (dto.format === ReportFormat.PDF) {
        const html = `
          <h1>${dto.reportCode}</h1>
          <pre>${JSON.stringify(data, null, 2)}</pre>
        `;
        filePath = await generatePdfFromHtml(html, fileName);
      }
      else if (dto.format === ReportFormat.CSV) {
        filePath = generateCsv(data as any[], fileName);
      }
      else if (dto.format === ReportFormat.EXCEL) {
        // Excel not implemented yet - fall back to CSV
        filePath = generateCsv(Array.isArray(data) ? data : [], fileName.replace('.xlsx', '') + '.csv');
      }

      await client.query(
        `
        INSERT INTO t_generated_reports
        (report_id, report_name, report_type, format, file_path, generated_at)
        VALUES ($1,$2,$3,$4,$5,NOW())
      `,
        [uuid(), dto.reportCode, dto.reportCode, dto.format, filePath],
      );

      return { filePath };
    });
  }

  /* ================= HISTORY ================= */

  async getHistory() {
    return this.db.query(`
      SELECT
        report_id,
        report_name,
        report_type,
        generated_at,
        file_path
      FROM t_generated_reports
      ORDER BY generated_at DESC
      LIMIT 20
    `);
  }
  // GUEST SUMMARY EXCEL
  /**
 * STEP 1:
 * Normalize Guest Summary Excel request coming from UI
 */
  normalizeGuestSummaryExcelRequest(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const reportCode = resolveGuestSummaryReportCode(input.rangeType);

    const { fromDate, toDate } = resolveDateRange(input.rangeType, {
      startDate: input.startDate,
      endDate: input.endDate,
    });

    const normalizedRequest = {
      reportCode,
      fromDate,
      toDate,
      format: ReportFormat.EXCEL,
    };

    // TEMP: log for verification during Step 1
    console.log('[Guest Summary Excel Normalized]', normalizedRequest);

    return normalizedRequest;
  }
  /**
   * STEP 2:
   * Fetch Guest Summary data using engine
   */
  async fetchGuestSummaryDataForExcel(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    // STEP 1: Normalize intent
    const normalized = this.normalizeGuestSummaryExcelRequest(input);

    // STEP 2: Call engine
    const engine = new GuestReportEngine(this.db);

    const result = await engine.run(normalized.reportCode, {
      fromDate: normalized.fromDate,
      toDate: normalized.toDate,
    });

    // 🔑 IMPORTANT: normalize DB response
    const rows = Array.isArray(result) ? result : result?.rows ?? [];

    console.log('[Guest Summary Data Rows]', rows.length);

    return {
      ...normalized,
      rows,
    };
  }
  async generateGuestSummaryExcel(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const result = await this.fetchGuestSummaryDataForExcel(input);

    const filePath = await exportGuestSummaryExcel({
      rows: result.rows,
      fromDate: result.fromDate,
      toDate: result.toDate,
    });

    return { filePath };
  }
  /**
   * ================= GUEST SUMMARY PDF =================
   *
   * STEP 1:
   * Normalize Guest Summary PDF request
   */
  normalizeGuestSummaryPdfRequest(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const reportCode = resolveGuestSummaryReportCode(input.rangeType);

    const { fromDate, toDate } = resolveDateRange(input.rangeType, {
      startDate: input.startDate,
      endDate: input.endDate,
    });

    const normalizedRequest = {
      reportCode,
      fromDate,
      toDate,
      format: ReportFormat.PDF,
    };

    console.log('[Guest Summary PDF Normalized]', normalizedRequest);

    return normalizedRequest;
  }
  /**
   * STEP 2:
   * Fetch Guest Summary data for PDF
   */
  async fetchGuestSummaryDataForPdf(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    // STEP 1: Normalize intent
    const normalized = this.normalizeGuestSummaryPdfRequest(input);

    // STEP 2: Call engine
    const engine = new GuestReportEngine(this.db);

    const result = await engine.run(normalized.reportCode, {
      fromDate: normalized.fromDate,
      toDate: normalized.toDate,
    });

    // 🔑 Normalize DB response
    const rows = Array.isArray(result) ? result : result?.rows ?? [];

    console.log('[Guest Summary PDF Data Rows]', rows.length);

    return {
      ...normalized,
      rows,
    };
  }
  /**
   * STEP 3:
   * Generate Guest Summary PDF (Playwright will be added later)
   */
  async generateGuestSummaryPdf(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const result = await this.fetchGuestSummaryDataForPdf(input);

    const isDaily = result.fromDate === result.toDate;

    const templateName = isDaily
      ? 'guest-summary-daily'
      : 'guest-summary-range';

    const payload = {
      meta: {
        title: isDaily
          ? 'DAILY GUEST-WISE ALLOCATION REPORT'
          : 'MONTHLY GUEST-WISE ALLOCATION & STAY REPORT',
        location: 'Raj Bhawan, Maharashtra',
        reportId: `RB/GMS/${Date.now()}`,
        fromDate: result.fromDate,
        toDate: result.toDate,
      },

      rows: result.rows.map(r => {
        const from = r.entry_date ? new Date(r.entry_date) : null;
        const to = r.exit_date ? new Date(r.exit_date) : from;

        const totalDays =
          from && to
            ? Math.max(
              1,
              Math.ceil(
                (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)
              )
            )
            : 1;

        return {
          ...r,
          stay_from: r.entry_date,
          stay_to: r.exit_date,
          total_days: totalDays,
        };
      }),

    };

    console.log('[Guest Summary PDF Payload]', {
      templateName,
      rows: payload.rows.length,
    });

    const templatePath = path.join(
      process.cwd(),
      'src',
      'reports-pkg',
      'templates',
      'guest-summary',
      `${templateName}.hbs`,
    );

    const filePath = await generatePdfFromTemplate({
      templatePath,
      outputFileName: `Guest_Summary_${Date.now()}`,
      payload,
    });

    return { filePath };
  }

  //================ ROOM SUMMARY====================
  normalizeRoomReportExcelRequest(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const reportCode = resolveRoomSummaryReportCode(input.rangeType);

    const { fromDate, toDate } = resolveDateRange(input.rangeType, {
      startDate: input.startDate,
      endDate: input.endDate,
    });

    return {
      reportCode,
      fromDate,
      toDate,
      format: ReportFormat.EXCEL,
    };
  }
  async fetchRoomOccupancyDataForExcel(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const normalized = this.normalizeRoomReportExcelRequest(input);

    const engine = new RoomReportEngine(this.db);

    const result = await engine.run(normalized.reportCode, {
      fromDate: normalized.fromDate,
      toDate: normalized.toDate,
    });

    const rows = Array.isArray(result) ? result : result?.rows ?? [];
    console.log('[Room Summary Data Rows]', rows.length);
    return { ...normalized, rows };
  }

  async generateRoomOccupancyExcel(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const result = await this.fetchRoomOccupancyDataForExcel(input);

    const filePath = await exportRoomOccupancyExcel({
      rows: result.rows,
      fromDate: result.fromDate,
      toDate: result.toDate,
    });

    return { filePath };
  }
  async generateRoomSummaryPdf(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { fromDate, toDate } = resolveDateRange(input.rangeType, {
      startDate: input.startDate,
      endDate: input.endDate,
    });

    const reportCode = resolveRoomSummaryReportCode(input.rangeType);

    const engine = new RoomReportEngine(this.db);
    const result = await engine.run(reportCode, { fromDate, toDate });

    // ✅ normalize DB response
    const rows = Array.isArray(result) ? result : result?.rows ?? [];

    console.log('[Room Summary PDF Rows]', rows.length);

    const payload = {
      meta: {
        title: 'GUEST-WISE ROOM & HOUSEKEEPING REPORT',
        location: 'Raj Bhawan, Maharashtra',
        reportId: `RB/GMS/ROOM/${Date.now()}`,
        fromDate,
        toDate,
      },

      rows: rows.map(r => ({
        guest_name: r.guest_name ?? '',
        room_no: r.room_no ?? '',
        housekeeper: r.housekeeper ?? '',
        cleaning_type: r.cleaning_type ?? '',
        check_in_date: r.check_in_date,
        check_out_date: r.check_out_date,
        remarks: r.remarks ?? '',
      })),
    };

    const templatePath = path.join(
      process.cwd(),
      'src',
      'reports-pkg',
      'templates',
      'room',
      'room-summary.hbs'
    );

    const filePath = await generatePdfFromTemplate({
      templatePath,
      outputFileName: `Room_Housekeeping_${Date.now()}`,
      payload,
    });

    return { filePath };
  }

  // ================= VEHICLE & DRIVER TRANSACTION =================

  /**
   * STEP 1:
   * Normalize Vehicle & Driver Excel request
   */
  normalizeVehicleDriverExcelRequest(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const reportCode = resolveVehicleDriverReportCode(input.rangeType);

    const { fromDate, toDate } = resolveDateRange(input.rangeType, {
      startDate: input.startDate,
      endDate: input.endDate,
    });

    const normalizedRequest = {
      reportCode,
      fromDate,
      toDate,
      format: ReportFormat.EXCEL,
    };

    console.log('[Vehicle Driver Excel Normalized]', normalizedRequest);

    return normalizedRequest;
  }

  /**
   * STEP 2:
   * Fetch Vehicle & Driver transaction data for Excel
   */
  async fetchVehicleDriverDataForExcel(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const normalized = this.normalizeVehicleDriverExcelRequest(input);

    const engine = new VehicleDriverReportEngine(this.db);

    const result = await engine.run(normalized.reportCode, {
      fromDate: normalized.fromDate,
      toDate: normalized.toDate,
    });

    const rows = Array.isArray(result) ? result : result?.rows ?? [];

    console.log('[Vehicle Driver Excel Rows]', rows.length);

    return {
      ...normalized,
      rows,
    };
  }

  /**
   * STEP 3:
   * Generate Vehicle & Driver Excel
   */
  async generateVehicleDriverExcel(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const result = await this.fetchVehicleDriverDataForExcel(input);

    const filePath = await exportVehicleDriverExcel({
      rows: result.rows,
      fromDate: result.fromDate,
      toDate: result.toDate,
    });

    return { filePath };
  }

  /**
   * ================= VEHICLE & DRIVER PDF =================
   *
   * STEP 1:
   * Normalize Vehicle & Driver PDF request
   */
  normalizeVehicleDriverPdfRequest(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const reportCode = resolveVehicleDriverReportCode(input.rangeType);

    const { fromDate, toDate } = resolveDateRange(input.rangeType, {
      startDate: input.startDate,
      endDate: input.endDate,
    });

    const normalizedRequest = {
      reportCode,
      fromDate,
      toDate,
      format: ReportFormat.PDF,
    };

    console.log('[Vehicle Driver PDF Normalized]', normalizedRequest);

    return normalizedRequest;
  }

  /**
   * STEP 2:
   * Fetch Vehicle & Driver transaction data for PDF
   */
  async fetchVehicleDriverDataForPdf(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const normalized = this.normalizeVehicleDriverPdfRequest(input);

    const engine = new VehicleDriverReportEngine(this.db);

    const result = await engine.run(normalized.reportCode, {
      fromDate: normalized.fromDate,
      toDate: normalized.toDate,
    });

    const rows = Array.isArray(result) ? result : result?.rows ?? [];

    console.log('[Vehicle Driver PDF Rows]', rows.length);

    return {
      ...normalized,
      rows,
    };
  }

  /**
   * STEP 3:
   * Generate Vehicle & Driver PDF
   */
  async generateVehicleDriverPdf(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const result = await this.fetchVehicleDriverDataForPdf(input);

    const payload = {
      meta: {
        title: 'VEHICLE & DRIVER TRANSACTION REPORT',
        location: 'Raj Bhawan, Maharashtra',
        reportId: `RB/GMS/VEHICLE/${Date.now()}`,
        fromDate: result.fromDate,
        toDate: result.toDate,
      },
      rows: result.rows,
    };

    const templatePath = path.join(
      process.cwd(),
      'src',
      'reports-pkg',
      'templates',
      'vehicle-driver',
      'vehicle-driver-summary.hbs'
    );

    const filePath = await generatePdfFromTemplate({
      templatePath,
      outputFileName: `Vehicle_Driver_Transactions_${Date.now()}`,
      payload,
    });

    return { filePath };
  }
  // ================= FOOD SERVICE TRANSACTION =================

  /**
   * STEP 1:
   * Normalize Food Service Excel request
   */
  normalizeFoodServiceExcelRequest(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const reportCode = resolveFoodServiceReportCode(input.rangeType);

    const { fromDate, toDate } = resolveDateRange(input.rangeType, {
      startDate: input.startDate,
      endDate: input.endDate,
    });

    const normalizedRequest = {
      reportCode,
      fromDate,
      toDate,
      format: ReportFormat.EXCEL,
    };

    console.log('[Food Service Excel Normalized]', normalizedRequest);

    return normalizedRequest;
  }

  /**
   * STEP 2:
   * Fetch Food Service transaction data for Excel
   */
  async fetchFoodServiceDataForExcel(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const normalized = this.normalizeFoodServiceExcelRequest(input);

    const engine = new FoodServiceReportEngine(this.db);

    const result = await engine.run(normalized.reportCode, {
      fromDate: normalized.fromDate,
      toDate: normalized.toDate,
    });

    const rows = Array.isArray(result) ? result : result?.rows ?? [];

    console.log('[Food Service Excel Rows]', rows.length);

    return {
      ...normalized,
      rows,
    };
  }

  /**
   * STEP 3:
   * Generate Food Service Excel
   */
  async generateFoodServiceExcel(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const result = await this.fetchFoodServiceDataForExcel(input);

    const filePath = await exportFoodServiceExcel({
      rows: result.rows,
      fromDate: result.fromDate,
      toDate: result.toDate,
    });

    return { filePath };
  }

  /**
   * ================= FOOD SERVICE PDF =================
   *
   * STEP 1:
   * Normalize Food Service PDF request
   */
  normalizeFoodServicePdfRequest(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const reportCode = resolveFoodServiceReportCode(input.rangeType);

    const { fromDate, toDate } = resolveDateRange(input.rangeType, {
      startDate: input.startDate,
      endDate: input.endDate,
    });

    const normalizedRequest = {
      reportCode,
      fromDate,
      toDate,
      format: ReportFormat.PDF,
    };

    console.log('[Food Service PDF Normalized]', normalizedRequest);

    return normalizedRequest;
  }

  /**
   * STEP 2:
   * Fetch Food Service transaction data for PDF
   */
  async fetchFoodServiceDataForPdf(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const normalized = this.normalizeFoodServicePdfRequest(input);

    const engine = new FoodServiceReportEngine(this.db);

    const result = await engine.run(normalized.reportCode, {
      fromDate: normalized.fromDate,
      toDate: normalized.toDate,
    });

    const rows = Array.isArray(result) ? result : result?.rows ?? [];

    console.log('[Food Service PDF Rows]', rows.length);

    return {
      ...normalized,
      rows,
    };
  }

  /**
   * STEP 3:
   * Generate Food Service PDF
   */
  async generateFoodServicePdf(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const result = await this.fetchFoodServiceDataForPdf(input);

    const payload = {
      meta: {
        title: 'FOOD SERVICE TRANSACTION REPORT',
        location: 'Raj Bhawan, Maharashtra',
        reportId: `RB/GMS/FOOD/${Date.now()}`,
        fromDate: result.fromDate,
        toDate: result.toDate,
      },
      rows: result.rows,
    };

    const templatePath = path.join(
      process.cwd(),
      'src',
      'reports-pkg',
      'templates',
      'food-service',
      'food-service-summary.hbs'
    );

    const filePath = await generatePdfFromTemplate({
      templatePath,
      outputFileName: `Food_Service_${Date.now()}`,
      payload,
    });

    return { filePath };
  }
  // ================= NETWORK TRANSACTION =================

  /**
   * STEP 1:
   * Normalize Network Excel request
   */
  normalizeNetworkExcelRequest(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const reportCode = resolveNetworkReportCode(input.rangeType);

    const { fromDate, toDate } = resolveDateRange(input.rangeType, {
      startDate: input.startDate,
      endDate: input.endDate,
    });

    const normalizedRequest = {
      reportCode,
      fromDate,
      toDate,
      format: ReportFormat.EXCEL,
    };

    console.log('[Network Excel Normalized]', normalizedRequest);

    return normalizedRequest;
  }

  /**
   * STEP 2:
   * Fetch Network transaction data for Excel
   */
  async fetchNetworkDataForExcel(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const normalized = this.normalizeNetworkExcelRequest(input);

    const engine = new NetworkReportEngine(this.db);

    const result = await engine.run(normalized.reportCode, {
      fromDate: normalized.fromDate,
      toDate: normalized.toDate,
    });

    const rows = Array.isArray(result) ? result : result?.rows ?? [];

    console.log('[Network Excel Rows]', rows.length);

    return {
      ...normalized,
      rows,
    };
  }

  /**
   * STEP 3:
   * Generate Network Excel
   */
  async generateNetworkExcel(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const result = await this.fetchNetworkDataForExcel(input);

    const filePath = await exportNetworkExcel({
      rows: result.rows,
      fromDate: result.fromDate,
      toDate: result.toDate,
    });

    return { filePath };
  }

  /**
   * ================= NETWORK PDF =================
   *
   * STEP 1:
   * Normalize Network PDF request
   */
  normalizeNetworkPdfRequest(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const reportCode = resolveNetworkReportCode(input.rangeType);

    const { fromDate, toDate } = resolveDateRange(input.rangeType, {
      startDate: input.startDate,
      endDate: input.endDate,
    });

    const normalizedRequest = {
      reportCode,
      fromDate,
      toDate,
      format: ReportFormat.PDF,
    };

    console.log('[Network PDF Normalized]', normalizedRequest);

    return normalizedRequest;
  }

  /**
   * STEP 2:
   * Fetch Network transaction data for PDF
   */
  async fetchNetworkDataForPdf(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const normalized = this.normalizeNetworkPdfRequest(input);

    const engine = new NetworkReportEngine(this.db);

    const result = await engine.run(normalized.reportCode, {
      fromDate: normalized.fromDate,
      toDate: normalized.toDate,
    });

    const rows = Array.isArray(result) ? result : result?.rows ?? [];

    console.log('[Network PDF Rows]', rows.length);

    return {
      ...normalized,
      rows,
    };
  }

  /**
   * STEP 3:
   * Generate Network PDF
   */
  async generateNetworkPdf(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const result = await this.fetchNetworkDataForPdf(input);

    const payload = {
      meta: {
        title: 'NETWORK TRANSACTION REPORT',
        location: 'Raj Bhawan, Maharashtra',
        reportId: `RB/GMS/NETWORK/${Date.now()}`,
        fromDate: result.fromDate,
        toDate: result.toDate,
      },
      rows: result.rows,
    };

    const templatePath = path.join(
      process.cwd(),
      'src',
      'reports-pkg',
      'templates',
      'network',
      'network-summary.hbs'
    );

    const filePath = await generatePdfFromTemplate({
      templatePath,
      outputFileName: `Network_Transactions_${Date.now()}`,
      payload,
    });

    return { filePath };
  }
  // ================= DRIVER DUTY TRANSACTION =================

  /**
   * STEP 1:
   * Normalize Driver Duty Excel request
   */
  normalizeDriverDutyExcelRequest(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const reportCode = resolveDriverDutyReportCode(input.rangeType);

    const { fromDate, toDate } = resolveDateRange(input.rangeType, {
      startDate: input.startDate,
      endDate: input.endDate,
    });

    const normalizedRequest = {
      reportCode,
      fromDate,
      toDate,
      format: ReportFormat.EXCEL,
    };

    console.log('[Driver Duty Excel Normalized]', normalizedRequest);

    return normalizedRequest;
  }

  /**
   * STEP 2:
   * Fetch Driver Duty data for Excel
   */
  async fetchDriverDutyDataForExcel(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const normalized = this.normalizeDriverDutyExcelRequest(input);

    const engine = new DriverDutyReportEngine(this.db);

    const result = await engine.run(normalized.reportCode, {
      fromDate: normalized.fromDate,
      toDate: normalized.toDate,
    });

    const rows = Array.isArray(result) ? result : result?.rows ?? [];

    console.log('[Driver Duty Excel Rows]', rows.length);

    return {
      ...normalized,
      rows,
    };
  }

  /**
   * STEP 3:
   * Generate Driver Duty Excel
   */
  async generateDriverDutyExcel(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const result = await this.fetchDriverDutyDataForExcel(input);

    const filePath = await exportDriverDutyExcel({
      rows: result.rows,
      fromDate: result.fromDate,
      toDate: result.toDate,
    });

    return { filePath };
  }

  /**
   * ================= DRIVER DUTY PDF =================
   */
  normalizeDriverDutyPdfRequest(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const reportCode = resolveDriverDutyReportCode(input.rangeType);

    const { fromDate, toDate } = resolveDateRange(input.rangeType, {
      startDate: input.startDate,
      endDate: input.endDate,
    });

    return {
      reportCode,
      fromDate,
      toDate,
      format: ReportFormat.PDF,
    };
  }

  async fetchDriverDutyDataForPdf(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const normalized = this.normalizeDriverDutyPdfRequest(input);

    const engine = new DriverDutyReportEngine(this.db);

    const result = await engine.run(normalized.reportCode, {
      fromDate: normalized.fromDate,
      toDate: normalized.toDate,
    });

    const rows = Array.isArray(result) ? result : result?.rows ?? [];

    console.log('[Driver Duty PDF Rows]', rows.length);

    return {
      ...normalized,
      rows,
    };
  }

  async generateDriverDutyPdf(input: {
    rangeType: string;
    startDate?: string;
    endDate?: string;
  }) {
    const result = await this.fetchDriverDutyDataForPdf(input);

    const payload = {
      meta: {
        title: 'DRIVER DUTY REPORT',
        location: 'Raj Bhawan, Maharashtra',
        reportId: `RB/GMS/DRIVER/${Date.now()}`,
        fromDate: result.fromDate,
        toDate: result.toDate,
      },
      rows: result.rows,
    };

    const templatePath = path.join(
      process.cwd(),
      'src',
      'reports-pkg',
      'templates',
      'driver-duty',
      'driver-duty-summary.hbs'
    );

    const filePath = await generatePdfFromTemplate({
      templatePath,
      outputFileName: `Driver_Duty_${Date.now()}`,
      payload,
    });

    return { filePath };
  }
  private sectionRegistry = {
    guest: {
      resolveCode: resolveGuestSummaryReportCode,
      engine: GuestReportEngine,
      excelExporter: exportGuestSummaryExcel,
      templateFolder: 'guest-summary',
    },

    room: {
      resolveCode: resolveRoomSummaryReportCode,
      engine: RoomReportEngine,
      excelExporter: exportRoomOccupancyExcel,
      templateFolder: 'room',
    },

    vehicle: {
      resolveCode: resolveVehicleDriverReportCode,
      engine: VehicleDriverReportEngine,
      excelExporter: exportVehicleDriverExcel,
      templateFolder: 'vehicle-driver',
    },

    'driver-duty': {
      resolveCode: resolveDriverDutyReportCode,
      engine: DriverDutyReportEngine,
      excelExporter: exportDriverDutyExcel,
      templateFolder: 'driver-duty',
    },

    food: {
      resolveCode: resolveFoodServiceReportCode,
      engine: FoodServiceReportEngine,
      excelExporter: exportFoodServiceExcel,
      templateFolder: 'food-service',
    },

    network: {
      resolveCode: resolveNetworkReportCode,
      engine: NetworkReportEngine,
      excelExporter: exportNetworkExcel,
      templateFolder: 'network',
    },
  };

  private getReportTitle(
    section: 'guest' | 'room' | 'vehicle' | 'driver-duty' | 'food' | 'network',
    language: 'en' | 'mr' = 'en'
  ) {
    const titles = {
      guest: {
        en: 'GUEST SUMMARY REPORT',
        mr: 'अतिथी सारांश अहवाल',
      },
      room: {
        en: 'ROOM & HOUSEKEEPING REPORT',
        mr: 'कक्ष व स्वच्छता अहवाल',
      },
      vehicle: {
        en: 'VEHICLE & DRIVER REPORT',
        mr: 'वाहन व चालक अहवाल',
      },
      'driver-duty': {
        en: 'DRIVER DUTY REPORT',
        mr: 'चालक कर्तव्य अहवाल',
      },
      food: {
        en: 'FOOD SERVICE REPORT',
        mr: 'अन्न सेवा अहवाल',
      },
      network: {
        en: 'NETWORK REPORT',
        mr: 'नेटवर्क अहवाल',
      },
    };

    return titles[section]?.[language] ?? section.toUpperCase();
  }
  private getReportLabels(language: 'en' | 'mr') {
    if (language === 'mr') {
      return {
        fromDate: 'सुरुवातीची तारीख',
        toDate: 'शेवटची तारीख',
        totalRecords: 'एकूण नोंदी',
      };
    }

    return {
      fromDate: 'From Date',
      toDate: 'To Date',
      totalRecords: 'Total Records',
    };
  }

  async generateReportGeneric(input: {
    section: 'guest' | 'room' | 'vehicle' | 'driver-duty' | 'food' | 'network';
    rangeType: string;
    format: 'PDF' | 'EXCEL' | 'VIEW';
    startDate?: string;
    endDate?: string;
    language?: 'en' | 'mr';
  }) {
    const config = this.sectionRegistry[input.section];

    if (!config) {
      throw new BadRequestException(`Unsupported section: ${input.section}`);
    }

    const language: 'en' | 'mr' = input.language ?? 'en';

    const { fromDate, toDate } = resolveDateRange(input.rangeType, {
      startDate: input.startDate,
      endDate: input.endDate,
    });

    const reportCode = config.resolveCode(input.rangeType);

    const engine = new config.engine(this.db);

    const result = await engine.run(reportCode, { 
      fromDate, 
      toDate, 
      language 
    });

    const rows = Array.isArray(result) ? result : result?.rows ?? [];

    /* ================= VIEW ================= */
    if (input.format === 'VIEW') {
      return {
        reportCode,
        fromDate,
        toDate,
        totalRecords: rows.length,
        rows,
      };
    }

    /* ================= EXCEL ================= */
    if (input.format === 'EXCEL') {
      const filePath = await config.excelExporter({
        rows,
        fromDate,
        toDate,
        language,
      });

      return { filePath };
    }

    /* ================= PDF ================= */
    if (input.format === 'PDF') {

      let templateFile = `${input.section}-summary.hbs`;

      // 🔥 SPECIAL CASE: guest has 2 templates
      if (input.section === 'guest') {
        const isDaily = fromDate === toDate;

        templateFile = isDaily
          ? 'guest-summary-daily.hbs'
          : 'guest-summary-range.hbs';
      }

      const templatePath = path.join(
        process.cwd(),
        'src',
        'reports-pkg',
        'templates',
        config.templateFolder,
        templateFile
      );

      const payload = {
        meta: {
          title: this.getReportTitle(input.section, language),
          location:
            language === 'mr'
              ? 'राजभवन, महाराष्ट्र'
              : 'Raj Bhawan, Maharashtra',
          reportId: `RB/GMS/${Date.now()}`,
          fromDate,
          toDate,
        },
        labels: this.getReportLabels(language),
        rows,
        language,
      };

      const filePath = await generatePdfFromTemplate({
        templatePath,
        outputFileName: `${input.section}_${language}_${Date.now()}`,
        payload,
      });

      return { filePath };
    }

    throw new BadRequestException('Unsupported format');
  }


  // ================= GENERIC VIEW (ALL REPORTS) =================
  async viewReport(input: {
    section: 'guest' | 'room' | 'vehicle' | 'driver-duty' | 'food' | 'network';
    rangeType: string;
    startDate?: string;
    endDate?: string;
    language?: 'en' | 'mr';
  }) {

    const { fromDate, toDate } = resolveDateRange(input.rangeType, {
      startDate: input.startDate,
      endDate: input.endDate,
    });
    const language: 'en' | 'mr' = input.language ?? 'en';
    let reportCode: ReportCode;
    let engine: any;

    switch (input.section) {

      /* ---------- Guest ---------- */
      case 'guest':
        reportCode = resolveGuestSummaryReportCode(input.rangeType);
        engine = new GuestReportEngine(this.db);
        break;

      /* ---------- Room ---------- */
      case 'room':
        reportCode = resolveRoomSummaryReportCode(input.rangeType);
        engine = new RoomReportEngine(this.db);
        break;

      /* ---------- Vehicle ---------- */
      case 'vehicle':
        reportCode = resolveVehicleDriverReportCode(input.rangeType);
        engine = new VehicleDriverReportEngine(this.db);
        break;

      /* ---------- Driver Duty ---------- */
      case 'driver-duty':
        reportCode = resolveDriverDutyReportCode(input.rangeType);
        engine = new DriverDutyReportEngine(this.db);
        break;

      /* ---------- Food ---------- */
      case 'food':
        reportCode = resolveFoodServiceReportCode(input.rangeType);
        engine = new FoodServiceReportEngine(this.db);
        break;

      /* ---------- Network ---------- */
      case 'network':
        reportCode = resolveNetworkReportCode(input.rangeType);
        engine = new NetworkReportEngine(this.db);
        break;

      default:
        throw new BadRequestException(`Unsupported section for view: ${input.section}`);
    }

    const result = await engine.run(reportCode, {
      fromDate,
      toDate,
      language
    });


    const rows = Array.isArray(result) ? result : result?.rows ?? [];

    return {
      reportCode,
      fromDate,
      toDate,
      totalRecords: rows.length,
      rows,
    };
  }


}
