import { Worker } from 'bullmq';
import { Pool } from 'pg';
import { exportPdf } from '../exporters/pdf.exporter';
import { exportGuestSummaryExcel } from '../exporters/excel.exporter';
import { ReportCode } from '../registry/report.registry';
import { GuestReportEngine } from '../engines/guest.engine';
import { RoomReportEngine } from '../engines/room.engine';
import { VehicleReportEngine } from '../engines/vehicle.engine';
import { StaffReportEngine } from '../engines/staff.engine';
import { NotificationReportEngine } from '../engines/notification.engine';
import { FoodReportEngine } from '../engines/food.engine';

/* Standalone Pool for worker (outside NestJS DI context) */
const pool = new Pool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'mtwo',
});

/* Wrapper matching DatabaseService interface */
const db = {
    async query(sql: string, params: any[] = []) {
        const result = await pool.query(sql, params);
        return result.rows;
    },
};

export const reportWorker = new Worker(
    'report-generation',
    async job => {
        const { jobId, reportCode, format, filters } = job.data;

        try {
            await db.query(
                `UPDATE t_report_jobs SET status='PROCESSING' WHERE job_id=$1`,
                [jobId],
            );

            let data: any[];

            switch (true) {
                case reportCode.startsWith('GUEST_'):
                    data = await new GuestReportEngine(db).run(reportCode, filters);
                    break;

                case reportCode.startsWith('ROOM_'):
                    data = await new RoomReportEngine(db).run(reportCode, filters);
                    break;

                case reportCode.startsWith('VEHICLE_'):
                    data = await new VehicleReportEngine(db).run(reportCode, filters);
                    break;

                case reportCode.startsWith('DUTY_') || reportCode.startsWith('STAFF_'):
                    data = await new StaffReportEngine(db).run(reportCode, filters);
                    break;

                case reportCode.startsWith('NOTIFICATION_'):
                    data = await new NotificationReportEngine(db).run(reportCode, filters);
                    break;

                case reportCode.startsWith('FOOD_'):
                    data = await new FoodReportEngine(db).run(reportCode, filters);
                    break;

                default:
                    throw new Error(`Unsupported report code: ${reportCode}`);
            }

            const filePath =
                format === 'PDF'
                    ? await exportPdf(reportCode, data)
                    : await exportGuestSummaryExcel({
                        rows: data,
                        fromDate: filters.fromDate,
                        toDate: filters.toDate,
                    });

            await db.query(
                `UPDATE t_report_jobs
         SET status='COMPLETED', file_path=$1, completed_at=NOW()
         WHERE job_id=$2`,
                [filePath, jobId],
            );

            return { success: true };
        } catch (err: any) {
            await db.query(
                `UPDATE t_report_jobs
         SET status='FAILED', error_message=$1
         WHERE job_id=$2`,
                [err.message, jobId],
            );

            throw err;
        }
    },
    // {
    //     connection: {
    //         host: 'localhost',
    //         port: 6379,
    //     },
    // },
);
