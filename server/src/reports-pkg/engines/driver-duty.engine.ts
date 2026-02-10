import { DbClient } from '../interfaces/db-client.interface';
import { ReportCode } from '../registry/report.registry';

export class DriverDutyReportEngine {
  constructor(private readonly db: DbClient) {}

  async run(
    reportCode: ReportCode,
    filters: { fromDate: string; toDate: string }
  ) {
    switch (reportCode) {
      case ReportCode.DRIVER_DUTY_DAILY_SUMMARY:
      case ReportCode.DRIVER_DUTY_WEEKLY_SUMMARY:
      case ReportCode.DRIVER_DUTY_MONTHLY_SUMMARY:
        return this.driverDutyTransactions(filters);

      default:
        throw new Error(`Unsupported driver duty report: ${reportCode}`);
    }
  }

  /**
   * Grain: one driver duty per date
   */
  private async driverDutyTransactions(filters: {
    fromDate: string;
    toDate: string;
  }) {
    const { fromDate, toDate } = filters;

    const result = await this.db.query(
      `
      SELECT
        td.duty_id,
        td.duty_date,
        td.shift,
        td.duty_in_time,
        td.duty_out_time,
        td.is_week_off,

        -- Driver
        d.driver_name,
        d.driver_contact,
        d.driver_license,
        d.license_expiry_date

      FROM t_driver_duty td

      JOIN m_driver d
        ON d.driver_id = td.driver_id
       AND d.is_active = true

      WHERE td.is_active = true
        AND td.duty_date BETWEEN $1 AND $2

      ORDER BY
        td.duty_date DESC,
        td.shift ASC
      `,
      [fromDate, toDate]
    );

    return result?.rows ?? [];
  }
}
