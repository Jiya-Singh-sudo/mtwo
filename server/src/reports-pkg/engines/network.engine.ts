import { DbClient } from '../interfaces/db-client.interface';
import { ReportCode } from '../registry/report.registry';

export class NetworkReportEngine {
  constructor(private readonly db: DbClient) {}

  async run(
    reportCode: ReportCode,
    filters: { fromDate: string; toDate: string }
  ) {
    switch (reportCode) {
      case ReportCode.NETWORK_DAILY_SUMMARY:
      case ReportCode.NETWORK_WEEKLY_SUMMARY:
      case ReportCode.NETWORK_MONTHLY_SUMMARY:
        return this.networkTransactionReport(filters);

      default:
        throw new Error(`Unsupported network report: ${reportCode}`);
    }
  }

  /**
   * Network transaction data for any date range
   * Grain: ONE network allocation per guest
   */
  private async networkTransactionReport(filters: {
    fromDate: string;
    toDate: string;
  }) {
    const { fromDate, toDate } = filters;

    const result = await this.db.query(
      `
      SELECT
        tgn.guest_network_id,

        -- Lifecycle

        tgn.network_status,

        -- Zones
        tgn.network_zone_from,
        tgn.network_zone_to,

        -- Guest
        g.guest_name,

        -- Room
        tgn.room_id,

        -- Network provider
        wp.provider_name,
        wp.network_type,
        wp.bandwidth_mbps,

        -- Messenger (contextual)
        s.full_name,
        s.designation,

        -- Notes
        tgn.remarks

      FROM t_guest_network tgn

      LEFT JOIN m_guest g
        ON g.guest_id = tgn.guest_id
       AND g.is_active = true

      LEFT JOIN m_wifi_provider wp
        ON wp.provider_id = tgn.provider_id
       AND wp.is_active = true

      LEFT JOIN t_guest_messenger tgm
        ON tgm.guest_id = tgn.guest_id
       AND tgm.is_active = true

      LEFT JOIN m_messenger ms
        ON ms.messenger_id = tgm.messenger_id
       AND ms.is_active = true
      LEFT JOIN m_staff s
        ON s.staff_id = tgm.staff_id

      WHERE tgn.is_active = true
        AND tgn.start_date BETWEEN $1 AND $2

      ORDER BY
        tgn.start_date DESC,
        tgn.start_time ASC
      `,
      [fromDate, toDate]
    );

    return result?.rows ?? [];
  }
}
