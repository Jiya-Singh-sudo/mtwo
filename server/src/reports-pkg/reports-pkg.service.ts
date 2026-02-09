import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ReportPreviewDto, ReportCode } from './dto/report-preview.dto';
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
            code: ReportCode.GUEST_SUMMARY,
            title: 'Guest Summary',
            description: 'Check-in, check-out and stay details',
          },
        ],
      },
      {
        category: 'Room Reports',
        reports: [
          {
            code: ReportCode.ROOM_OCCUPANCY,
            title: 'Room Occupancy',
            description: 'Room-wise occupancy status',
          },
          {
            code: ReportCode.ROOM_OCCUPANCY_TREND,
            title: 'Room Occupancy Trend',
            description: 'Daily occupied rooms over time',
          },
        ],
      },
      {
        category: 'Vehicle Reports',
        reports: [
          {
            code: ReportCode.VEHICLE_USAGE,
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
      case ReportCode.GUEST_SUMMARY:
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

      case ReportCode.ROOM_OCCUPANCY:
        return this.db.query(`
          SELECT
            status AS label,
            COUNT(*)::int AS value
          FROM m_rooms
          WHERE is_active = true
          GROUP BY status
        `);

      case ReportCode.VEHICLE_USAGE:
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


      case ReportCode.ROOM_OCCUPANCY_TREND:
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

    await this.db.query(
      `
      INSERT INTO t_generated_reports
      (report_id, report_name, report_type, format, file_path, generated_at)
      VALUES ($1,$2,$3,$4,$5,NOW())
    `,
      [uuid(), dto.reportCode, dto.reportCode, dto.format, filePath],
    );

    return { filePath };
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


}
