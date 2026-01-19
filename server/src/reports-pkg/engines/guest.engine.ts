import { DbClient } from '../interfaces/db-client.interface';
import { ReportCode } from '../registry/report.registry';

export class GuestReportEngine {
    constructor(private readonly db: DbClient) { }

    async run(reportCode: ReportCode, filters: any) {
        switch (reportCode) {

            case ReportCode.GUEST_DAILY_SUMMARY:
                return this.dailySummary();

            default:
                throw new Error(`Unsupported guest report: ${reportCode}`);
        }
    }

    private async dailySummary() {
        return this.db.query(`
      SELECT
        g.guest_id,
        g.guest_name,
        r.room_no,
        gr.check_in_date,
        gr.check_out_date,
        io.guest_inout AS is_inside,
        io.entry_time,
        io.exit_time
      FROM m_guest g
      LEFT JOIN t_guest_room gr
        ON gr.guest_id = g.guest_id
        AND gr.is_active = true
      LEFT JOIN m_rooms r
        ON r.room_id = gr.room_id
      LEFT JOIN t_guest_inout io
        ON io.guest_id = g.guest_id
        AND io.entry_date = CURRENT_DATE
      WHERE g.is_active = true
        AND gr.check_in_date = CURRENT_DATE
      ORDER BY g.guest_name
    `);
    }
}
