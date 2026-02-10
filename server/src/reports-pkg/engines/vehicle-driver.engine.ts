// server/src/reports-pkg/engines/vehicle-driver.engine.ts

import { DbClient } from '../interfaces/db-client.interface';
import { ReportCode } from '../registry/report.registry';

export class VehicleDriverReportEngine {
  constructor(private readonly db: DbClient) {}

  async run(
    reportCode: ReportCode,
    filters: { fromDate: string; toDate: string }
  ) {
    switch (reportCode) {
      case ReportCode.VEHICLE_DRIVER_DAILY_SUMMARY:
      case ReportCode.VEHICLE_DRIVER_WEEKLY_SUMMARY:
      case ReportCode.VEHICLE_DRIVER_MONTHLY_SUMMARY:
        return this.transactionReport(filters);

      default:
        throw new Error(`Unsupported vehicle-driver report: ${reportCode}`);
    }
  }

  private async transactionReport(filters: {
    fromDate: string;
    toDate: string;
  }) {
    const { fromDate, toDate } = filters;

    const result = await this.db.query(
      `
      SELECT
        tgd.guest_driver_id,
        tgd.trip_date,
        tgd.start_time,
        tgd.end_time,
        tgd.from_location,
        tgd.to_location,
        tgd.pickup_location,
        tgd.drop_location,
        tgd.pickup_status,
        tgd.drop_status,
        tgd.trip_status,
        tgd.remarks,

        g.guest_name,

        d.driver_name,
        d.driver_contact,
        d.driver_license,
        d.license_expiry_date,

        v.vehicle_no,
        v.vehicle_name,
        v.model,
        v.capacity

      FROM t_guest_driver tgd

      LEFT JOIN m_guest g
        ON g.guest_id = tgd.guest_id
       AND g.is_active = true

      LEFT JOIN m_driver d
        ON d.driver_id = tgd.driver_id
       AND d.is_active = true

      LEFT JOIN m_vehicle v
        ON v.vehicle_no = tgd.vehicle_no
       AND v.is_active = true

      WHERE tgd.is_active = true
        AND tgd.trip_date BETWEEN $1 AND $2

      ORDER BY tgd.trip_date DESC, tgd.start_time ASC
      `,
      [fromDate, toDate]
    );

    return result?.rows ?? [];
  }
}
