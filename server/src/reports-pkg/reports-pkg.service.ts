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

    const vehiclesResult = await this.db.query(`
      SELECT
        ROUND(
          COUNT(CASE WHEN is_active = true THEN 1 END)::decimal
          / NULLIF(COUNT(*),0) * 100
        ) AS vehicle_utilization
      FROM m_vehicle
    `);

    const vehicles = vehiclesResult?.[0];
    const rooms = roomsResult?.[0];


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
            code: 'GUEST_SUMMARY',
            title: 'Guest Summary',
            description: 'Check-in, check-out and stay details',
          },
        ],
      },
      {
        category: 'Room Reports',
        reports: [
          {
            code: 'ROOM_OCCUPANCY',
            title: 'Room Occupancy',
            description: 'Room-wise occupancy status',
          },
        ],
      },
      {
        category: 'Vehicle Reports',
        reports: [
          {
            code: 'VEHICLE_USAGE',
            title: 'Vehicle Usage',
            description: 'Trips and assignments per vehicle',
          },
        ],
      },
    ];
  }

  /* ================= PREVIEW ================= */

  async previewReport(dto: ReportPreviewDto) {
    switch (dto.reportCode) {
      case ReportCode.GUEST_SUMMARY:
        return this.db.query(`
          SELECT g.guest_name, r.room_no, gr.check_in_date, gr.check_out_date
          FROM t_guest_room gr
          JOIN m_guest g ON g.guest_id = gr.guest_id
          LEFT JOIN m_rooms r ON r.room_id = gr.room_id
          WHERE gr.is_active = true
        `);

      case ReportCode.ROOM_OCCUPANCY:
        return this.db.query(`
          SELECT room_no, status
          FROM m_rooms
          WHERE is_active = true
        `);

      case ReportCode.VEHICLE_USAGE:
        return this.db.query(`
          SELECT vehicle_no, COUNT(*) AS trips
          FROM t_guest_driver
          WHERE is_active = true
          GROUP BY vehicle_no
        `);

      case ReportCode.ROOM_OCCUPANCY_TREND:
        // Return mock trend data for now (can be replaced with real aggregation later)
        const today = new Date();
        const trendData: { date: string; count: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          trendData.push({
            date: date.toISOString().slice(0, 10),
            count: Math.floor(Math.random() * 20) + 10, // Mock data: 10-30 rooms
          });
        }
        return trendData;

      default:
        return [];
    }
  }

  /* ================= GENERATE ================= */

  async generateReport(dto: ReportGenerateDto) {
    const data = await this.previewReport(dto);
    const fileName = `${dto.reportCode}-${Date.now()}`;

    let filePath = '';

    if (dto.format === ReportFormat.PDF) {
      const html = `
        <h1>${dto.reportCode}</h1>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      `;
      filePath = await generatePdfFromHtml(html, fileName);
    } else if (dto.format === ReportFormat.EXCEL) {
      filePath = `/uploads/reports/${fileName}.xlsx`;
    } else if (dto.format === ReportFormat.CSV) {
      filePath = generateCsv(data as any[], fileName);
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
      SELECT report_id, report_name, report_type, generated_at, file_path
      FROM t_generated_reports
      ORDER BY generated_at DESC
      LIMIT 20
    `);
  }
}
