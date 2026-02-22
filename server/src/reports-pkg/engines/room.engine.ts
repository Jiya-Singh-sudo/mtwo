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
      SELECT DISTINCT ON (gr.guest_id, gr.room_id, gr.check_in_date)
        g.guest_name,
        r.room_no,
        hk.hk_name AS housekeeper,
        gr.check_in_date,
        gr.check_out_date,
        gr.remarks

      FROM t_guest_room gr
      JOIN m_guest g ON g.guest_id = gr.guest_id
      JOIN m_rooms r ON r.room_id = gr.room_id

      LEFT JOIN t_guest_hk gh
        ON gh.guest_id = gr.guest_id
      AND gh.task_date BETWEEN $1 AND $2
      AND gh.is_active = true

      LEFT JOIN m_housekeeping hk
        ON hk.hk_id = gh.hk_id

      WHERE gr.check_in_date <= $2
        AND (gr.check_out_date IS NULL OR gr.check_out_date >= $1)

      ORDER BY
        gr.guest_id,
        gr.room_id,
        gr.check_in_date,
        gh.task_date DESC;
      `,
      [filters.fromDate, filters.toDate]
    );
  }


}
