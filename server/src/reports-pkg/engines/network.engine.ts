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

        -- lifecycle
        gi.entry_date,
        gi.exit_date,
        tgn.network_status,

        -- zones
        tgn.network_zone_from,
        tgn.network_zone_to,

        -- guest
        g.guest_name,

        -- room
        r.room_no,

        -- provider
        wp.provider_name,
        wp.network_type,

        -- messenger
        s.full_name AS messenger_name,
        s.designation,

        -- notes
        tgn.remarks

      FROM t_guest_network tgn

      LEFT JOIN m_guest g
        ON g.guest_id = tgn.guest_id
      AND g.is_active = true

      LEFT JOIN t_guest_inout gi
        ON gi.guest_id = tgn.guest_id
      AND gi.is_active = true

      LEFT JOIN m_rooms r
        ON r.room_id = tgn.room_id
      AND r.is_active = true

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
        ON s.staff_id = ms.staff_id
      AND s.is_active = true

      WHERE tgn.is_active = true
        AND gi.entry_date BETWEEN $1 AND $2

      ORDER BY gi.entry_date DESC
      `,
      [fromDate, toDate]
    );

    return result?.rows ?? [];
  }
}
