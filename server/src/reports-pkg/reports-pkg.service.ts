import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ReportCode } from './registry/report.registry';
import { ReportRequestDto } from './dto/report-request.dto';
import { exportPdf } from './exporters/pdf.exporter';
import { exportExcel } from './exporters/excel.exporter';
import { GuestReportEngine } from './engines/guest.engine';
import { RoomReportEngine } from './engines/room.engine';
import { VehicleReportEngine } from './engines/vehicle.engine';
import { StaffReportEngine } from './engines/staff.engine';
import { NotificationReportEngine } from './engines/notification.engine';
import { FoodReportEngine } from './engines/food.engine';
import { reportQueue } from './queue/report.queue';



import { v4 as uuid } from 'uuid';

@Injectable()
export class ReportsPkgService {
  constructor(private readonly db: DatabaseService) {}

  /* ================= KPI METRICS ================= */

  async getDashboardMetrics() {
    const [occupancy] = await this.db.query(`
      SELECT ROUND(
        COUNT(*) FILTER (WHERE status = 'OCCUPIED')::decimal
        / NULLIF(COUNT(*), 0) * 100
      ) AS occupancy_rate
      FROM m_rooms
      WHERE is_active = true
    `);

    const [vehicle] = await this.db.query(`
      SELECT ROUND(
        COUNT(*) FILTER (WHERE is_active = true)::decimal
        / NULLIF(COUNT(*), 0) * 100
      ) AS vehicle_utilization
      FROM m_vehicel
    `);

    return {
      occupancyRate: Number(occupancy?.occupancy_rate ?? 0),
      vehicleUtilization: Number(vehicle?.vehicle_utilization ?? 0),
      staffEfficiency: 85,     // derived later
      guestSatisfaction: 92,   // survey based
    };
  }
async createReportJob(dto: ReportRequestDto, userId: string | null) {
  const jobId = uuid();

  await this.db.query(
    `INSERT INTO t_report_jobs
     (job_id, report_type, format, status, requested_by)
     VALUES ($1,$2,$3,'PENDING',$4)`,
    [jobId, dto.reportCode, dto.format, userId],
  );

  await reportQueue.add('generate', {
    jobId,
    reportCode: dto.reportCode,
    format: dto.format,
    filters: dto,
  });

  return {
    jobId,
    status: 'PENDING',
  };
}

  /* ================= PREVIEW ================= */

async previewReport(reportCode: ReportCode, filters: any) {
  switch (true) {

    case reportCode.startsWith('GUEST_'):
      return new GuestReportEngine(this.db).run(reportCode, filters);

    case reportCode.startsWith('ROOM_'):
      return new RoomReportEngine(this.db).run(reportCode, filters);

    case reportCode.startsWith('VEHICLE_'):
      return new VehicleReportEngine(this.db).run(reportCode, filters);

    case reportCode.startsWith('DUTY_') || reportCode.startsWith('STAFF_'):
      return new StaffReportEngine(this.db).run(reportCode, filters);

    case reportCode.startsWith('NOTIFICATION_') ||
         reportCode.startsWith('COMMUNICATION_'):
      return new NotificationReportEngine(this.db).run(reportCode, filters);

    case reportCode.startsWith('FOOD_'):
      return new FoodReportEngine(this.db).run(reportCode, filters);

    default:
      throw new Error(`Unsupported report code: ${reportCode}`);
  }
}

  /* ================= GENERATE ================= */

  async generateReport(dto: ReportRequestDto, userId: string | null) {
    const data = await this.previewReport(dto.reportCode, dto);

    const filePath =
      dto.format === 'PDF'
        ? await exportPdf(dto.reportCode, data)
        : await exportExcel(dto.reportCode, data);

    await this.db.query(
      `INSERT INTO t_generated_reports
       (report_id, report_name, report_type, format, generated_by, file_path)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        uuid(),
        dto.reportCode.replace(/_/g, ' '),
        dto.reportCode,
        dto.format,
        userId,
        filePath,
      ],
    );

    return {
      success: true,
      filePath,
    };
  }

  /* ================= HISTORY ================= */

  async getGeneratedReports() {
    return this.db.query(`
      SELECT
        report_id,
        report_name,
        report_type,
        format,
        generated_at,
        generated_by,
        file_path
      FROM t_generated_reports
      WHERE is_active = true
      ORDER BY generated_at DESC
      LIMIT 20
    `);
  }
  async getReportJob(jobId: string) {
    const [job] = await this.db.query(
        `SELECT status, file_path, error_message
        FROM t_report_jobs
        WHERE job_id=$1`,
        [jobId],
    );

    return job;
    }

}
