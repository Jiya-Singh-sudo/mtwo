import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { GenerateReportDto, ReportFormat } from './dto/generate-report.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ReportsService {
    constructor(private readonly db: DatabaseService) { }

    /* ---------------- KPIs ---------------- */

    async getDashboardMetrics() {
        const [occupancy] = await this.db.query(`
      SELECT ROUND(
        (COUNT(CASE WHEN status='OCCUPIED' THEN 1 END)::decimal
        / NULLIF(COUNT(*), 0)) * 100
      ) AS occupancy_rate
      FROM m_room
    `);

        const [vehicle] = await this.db.query(`
      SELECT ROUND(
        (COUNT(CASE WHEN is_in_use=true THEN 1 END)::decimal
        / NULLIF(COUNT(*), 0)) * 100
      ) AS vehicle_utilization
      FROM m_vehicle
    `);

        return {
            occupancyRate: occupancy?.occupancy_rate ?? 0,
            vehicleUtilization: vehicle?.vehicle_utilization ?? 0,
            staffEfficiency: 85,      // computed or derived later
            guestSatisfaction: 92,    // survey-based
        };
    }

    /* ----------- Generate Report ----------- */

    async generateReport(dto: GenerateReportDto) {
        const data = await this.previewReport(dto.reportType, dto);

        const filePath =
            dto.format === ReportFormat.PDF
                ? await this.generatePdf(dto.reportType, data)
                : await this.generateExcel(dto.reportType, data);

        await this.db.query(
            `INSERT INTO t_generated_reports
       (report_id, report_name, report_type, format, file_path)
       VALUES ($1,$2,$3,$4,$5)`,
            [
                uuid(),
                dto.reportType,
                dto.reportType,
                dto.format,
                filePath,
            ],
        );

        return { success: true, filePath };
    }

    /* ----------- Preview Data -------------- */

    async previewReport(type: string, filters: any) {
        switch (type) {
            case 'GUEST_SUMMARY':
                return this.db.query(`
          SELECT guest_name, check_in, check_out, status
          FROM t_guest
          WHERE check_in::date = CURRENT_DATE
        `);

            case 'ROOM_OCCUPANCY':
                return this.db.query(`
          SELECT room_no, status
          FROM m_room
        `);

            case 'VEHICLE_USAGE':
                return this.db.query(`
          SELECT v.vehicle_no, COUNT(t.trip_id) trips
          FROM t_vehicle_trip t
          JOIN m_vehicle v ON v.vehicle_id=t.vehicle_id
          GROUP BY v.vehicle_no
        `);

            default:
                return [];
        }
    }

    /* ----------- History ------------------- */

    async getGeneratedReports() {
        return this.db.query(`
      SELECT report_name, report_type, generated_at, format, file_path
      FROM t_generated_reports
      ORDER BY generated_at DESC
      LIMIT 20
    `);
    }

    /* ----------- Job-based Report Generation ----------- */

    async createReportJob(dto: GenerateReportDto, userId: string) {
        const jobId = uuid();

        await this.db.query(
            `INSERT INTO t_report_jobs
       (job_id, report_type, format, status, requested_by)
       VALUES ($1,$2,$3,'PENDING',$4)`,
            [jobId, dto.reportType, dto.format, userId],
        );

        // TODO: Push to queue (Bull / RabbitMQ / SQS)
        // For now, process synchronously
        await this.processReportJob(jobId, dto);

        return {
            jobId,
            status: 'PENDING',
        };
    }

    async getJobStatus(jobId: string) {
        const [job] = await this.db.query(
            `SELECT status, file_path, error_message
       FROM t_report_jobs WHERE job_id=$1`,
            [jobId],
        );

        return job;
    }

    async downloadReport(jobId: string) {
        const [job] = await this.db.query(
            `SELECT file_path FROM t_report_jobs
       WHERE job_id=$1 AND status='COMPLETED'`,
            [jobId],
        );

        if (!job) throw new NotFoundException('Report not found or not ready');

        return {
            url: job.file_path,
        };
    }

    /* ----------- Export Engines ------------ */

    private async generatePdf(type: string, data: any[]) {
        // TODO: Use pdfkit / puppeteer
        return `/reports/${type}-${Date.now()}.pdf`;
    }

    private async generateExcel(type: string, data: any[]) {
        // TODO: Use exceljs
        return `/reports/${type}-${Date.now()}.xlsx`;
    }

    /* ----------- Internal Job Processor ------------ */

    private async processReportJob(jobId: string, dto: GenerateReportDto) {
        try {
            await this.db.query(
                `UPDATE t_report_jobs SET status='PROCESSING' WHERE job_id=$1`,
                [jobId],
            );

            const data = await this.previewReport(dto.reportType, dto);

            const filePath =
                dto.format === ReportFormat.PDF
                    ? await this.generatePdf(dto.reportType, data)
                    : await this.generateExcel(dto.reportType, data);

            await this.db.query(
                `UPDATE t_report_jobs
         SET status='COMPLETED', file_path=$1, completed_at=NOW()
         WHERE job_id=$2`,
                [filePath, jobId],
            );
        } catch (err: any) {
            await this.db.query(
                `UPDATE t_report_jobs
         SET status='FAILED', error_message=$1
         WHERE job_id=$2`,
                [err.message, jobId],
            );
        }
    }
}
