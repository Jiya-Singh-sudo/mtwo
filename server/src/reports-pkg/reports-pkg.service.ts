import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ReportPreviewDto, ReportCode } from './dto/report-preview.dto';
import { ReportGenerateDto, ReportFormat } from './dto/report-generate.dto';
import { v4 as uuid } from 'uuid';
import { generatePdfFromHtml } from '../../common/utlis/pdf.utils';
import { generateCsv } from '../../common/utlis/csv.util';

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
}
