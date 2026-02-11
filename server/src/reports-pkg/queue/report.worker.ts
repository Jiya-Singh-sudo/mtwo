import { Worker } from 'bullmq';
import { Pool } from 'pg';
import { exportPdf } from '../exporters/pdf.exporter';
import { exportGuestSummaryExcel } from '../exporters/guest.excel.exporter';
import { ReportCode } from '../registry/report.registry';
import { GuestReportEngine } from '../engines/guest.engine';
import { RoomReportEngine } from '../engines/room.engine';
import { VehicleDriverReportEngine } from '../engines/vehicle-driver.engine';
import { FoodServiceReportEngine } from '../engines/food-service.engine';
import { DbClient } from '../interfaces/db-client.interface';

/* Standalone Pool for worker (outside NestJS DI context) */
const pool = new Pool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'mtwo',
});

/* Wrapper matching DatabaseService interface */
const db: DbClient = {
  async query(sql: string, params: any[] = []) {
    const result = await pool.query(sql, params);
    return result.rows;
  },

  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
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
                    data = await new VehicleDriverReportEngine(db).run(reportCode, filters);
                    break;

                case reportCode.startsWith('FOOD_'):
                    data = await new FoodServiceReportEngine(db).run(reportCode, filters);
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
