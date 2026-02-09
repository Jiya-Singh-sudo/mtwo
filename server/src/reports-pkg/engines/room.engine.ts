import { DbClient } from '../interfaces/db-client.interface';
import { ReportCode } from '../registry/report.registry';

export class RoomReportEngine {
    constructor(private readonly db: DbClient) { }

    async run(reportCode: ReportCode, filters: { fromDate: string; toDate: string }) {
      switch (reportCode) {
        case ReportCode.ROOM_DAILY_SUMMARY:
        case ReportCode.ROOM_WEEKLY_SUMMARY:
        case ReportCode.ROOM_MONTHLY_SUMMARY:
          return this.roomSummary(filters);

        default:
          throw new Error(`Unsupported room report: ${reportCode}`);
      }
    }


    /**
     * ROOM OCCUPANCY TRENDS
     *
     * Output (per day):
     * - date
     * - total rooms
     * - occupied rooms
     * - occupancy percentage
     *
     * Tables used:
     * - m_rooms
     * - t_guest_room
     */
  private async roomSummary(filters: { fromDate: string; toDate: string }) {
    return this.db.query(
      `
      SELECT
        g.guest_name,
        r.room_no,
        hk.hk_name AS housekeeper,
        rh.service_type AS cleaning_type,
        gr.check_in_date,
        gr.check_out_date,
        gr.remarks
      FROM t_guest_room gr
      JOIN m_guest g ON g.guest_id = gr.guest_id
      JOIN m_rooms r ON r.room_id = gr.room_id

      LEFT JOIN t_room_housekeeping rh
        ON rh.room_id = gr.room_id
      AND rh.task_date BETWEEN $1 AND $2

      LEFT JOIN m_housekeeping hk
        ON hk.hk_id = rh.hk_id

      WHERE (gr.is_active = true OR gr.is_active = false)
        AND gr.check_in_date <= $2
        AND (gr.check_out_date IS NULL OR gr.check_out_date >= $1)

      ORDER BY r.room_no;
      `,
      [filters.fromDate, filters.toDate]
    );
  }

}
