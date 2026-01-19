import { DbClient } from '../interfaces/db-client.interface';
import { ReportCode } from '../registry/report.registry';

export class RoomReportEngine {
    constructor(private readonly db: DbClient) { }

    async run(reportCode: ReportCode, filters: any) {
        switch (reportCode) {

            case ReportCode.ROOM_OCCUPANCY_TRENDS:
                return this.occupancyTrends(filters);

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
    private async occupancyTrends(filters: any) {
        const startDate =
            filters.startDate ?? new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
                .toISOString()
                .slice(0, 10);

        const endDate =
            filters.endDate ?? new Date().toISOString().slice(0, 10);

        return this.db.query(
            `
      WITH date_series AS (
        SELECT generate_series(
          $1::date,
          $2::date,
          interval '1 day'
        )::date AS report_date
      ),
      room_count AS (
        SELECT COUNT(*) AS total_rooms
        FROM m_rooms
        WHERE is_active = true
      )
      SELECT
        ds.report_date,
        rc.total_rooms,
        COUNT(gr.guest_room_id) AS occupied_rooms,
        ROUND(
          COUNT(gr.guest_room_id)::decimal
          / NULLIF(rc.total_rooms, 0) * 100,
          2
        ) AS occupancy_percentage
      FROM date_series ds
      CROSS JOIN room_count rc
      LEFT JOIN t_guest_room gr
        ON gr.check_in_date <= ds.report_date
       AND (gr.check_out_date IS NULL OR gr.check_out_date >= ds.report_date)
       AND gr.is_active = true
      GROUP BY ds.report_date, rc.total_rooms
      ORDER BY ds.report_date
      `,
            [startDate, endDate],
        );
    }
}
