import { DbClient } from '../interfaces/db-client.interface';
import { ReportCode } from '../registry/report.registry';

export class StaffReportEngine {
    constructor(private readonly db: DbClient) { }

    async run(reportCode: ReportCode, filters: any) {
        switch (reportCode) {

            case ReportCode.DUTY_PERFORMANCE:
                return this.dutyPerformance(filters);

            default:
                throw new Error(`Unsupported staff report: ${reportCode}`);
        }
    }

    /**
     * DUTY PERFORMANCE REPORT
     *
     * Combines:
     * - Butler
     * - Housekeeping
     * - Messenger
     *
     * Output:
     * - staff_id
     * - staff_name
     * - staff_type
     * - total_assignments
     */
    private async dutyPerformance(filters: any) {
        const startDate =
            filters.startDate ?? '1900-01-01';
        const endDate =
            filters.endDate ?? new Date().toISOString().slice(0, 10);

        return this.db.query(
            `
      SELECT
        staff_id,
        staff_name,
        staff_type,
        COUNT(assignment_id) AS total_assignments
      FROM (
        /* ---------------- BUTLER ---------------- */
        SELECT
          b.butler_id AS staff_id,
          b.butler_name AS staff_name,
          'BUTLER' AS staff_type,
          gb.guest_butler_id AS assignment_id,
          gb.inserted_at::date AS assignment_date
        FROM t_guest_butler gb
        JOIN m_butler b ON b.butler_id = gb.butler_id
        WHERE gb.is_active = true

        UNION ALL

        /* ------------ HOUSEKEEPING -------------- */
        SELECT
          h.hk_id AS staff_id,
          h.hk_name AS staff_name,
          'HOUSEKEEPING' AS staff_type,
          gh.guest_hk_id AS assignment_id,
          gh.assignment_date::date AS assignment_date
        FROM t_guest_hk gh
        JOIN m_housekeeping h ON h.hk_id = gh.hk_id
        WHERE gh.is_active = true

        UNION ALL

        /* --------------- MESSENGER -------------- */
        SELECT
          m.messenger_id AS staff_id,
          m.messenger_name AS staff_name,
          'MESSENGER' AS staff_type,
          gm.guest_messenger_id AS assignment_id,
          gm.assignment_date::date AS assignment_date
        FROM t_guest_messenger gm
        JOIN m_messenger m ON m.messenger_id = gm.messenger_id
        WHERE gm.is_active = true
      ) duties
      WHERE assignment_date BETWEEN $1 AND $2
      GROUP BY staff_id, staff_name, staff_type
      ORDER BY staff_type, staff_name
      `,
            [startDate, endDate],
        );
    }
}
