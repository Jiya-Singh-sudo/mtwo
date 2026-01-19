import { DbClient } from '../interfaces/db-client.interface';
import { ReportCode } from '../registry/report.registry';

export class NotificationReportEngine {
    constructor(private readonly db: DbClient) { }

    async run(reportCode: ReportCode, filters: any) {
        switch (reportCode) {

            case ReportCode.NOTIFICATION_LOGS:
                return this.notificationLogs(filters);

            default:
                throw new Error(`Unsupported notification report: ${reportCode}`);
        }
    }

    /**
     * NOTIFICATION LOGS REPORT
     *
     * Shows:
     * - event type
     * - recipient
     * - channel (SMS / WhatsApp / Email)
     * - status
     * - attempts
     * - last error
     * - timestamps
     */
    private async notificationLogs(filters: any) {
        const startDate =
            filters.startDate ?? '1900-01-01';
        const endDate =
            filters.endDate ?? new Date().toISOString();

        return this.db.query(
            `
      SELECT
        id,
        event_type,
        recipient,
        channel,
        status,
        attempts,
        last_error,
        created_at,
        updated_at
      FROM m_notifications
      WHERE created_at BETWEEN $1 AND $2
      ORDER BY created_at DESC
      `,
            [startDate, endDate],
        );
    }
}
