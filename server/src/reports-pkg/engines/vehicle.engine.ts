import { DbClient } from '../interfaces/db-client.interface';
import { ReportCode } from '../registry/report.registry';

export class VehicleReportEngine {
    constructor(private readonly db: DbClient) { }

    async run(reportCode: ReportCode, filters: any) {
        switch (reportCode) {

            case ReportCode.VEHICLE_USAGE:
                return this.vehicleUsage(filters);

            default:
                throw new Error(`Unsupported vehicle report: ${reportCode}`);
        }
    }

    /**
     * VEHICLE USAGE REPORT
     *
     * Shows:
     * - vehicle number
     * - vehicle name
     * - total assignments
     * - active assignments
     * - drivers involved
     *
     * Tables:
     * - t_guest_vehicle
     * - m_vehicel
     * - m_driver
     */
    private async vehicleUsage(filters: any) {
        const startDate =
            filters.startDate ?? '1900-01-01';
        const endDate =
            filters.endDate ?? new Date().toISOString().slice(0, 10);

        return this.db.query(
            `
      SELECT
        v.vehicle_no,
        v.vehicle_name,
        COUNT(gv.guest_vehicle_id) AS total_assignments,
        COUNT(gv.guest_vehicle_id)
          FILTER (WHERE gv.released_at IS NULL) AS active_assignments,
        STRING_AGG(
          DISTINCT d.driver_name,
          ', '
        ) AS drivers_used
      FROM m_vehicel v
      LEFT JOIN t_guest_vehicle gv
        ON gv.vehicle_no = v.vehicle_no
       AND gv.assigned_at::date BETWEEN $1 AND $2
       AND gv.is_active = true
      LEFT JOIN m_driver d
        ON d.driver_id = gv.driver_id
      WHERE v.is_active = true
      GROUP BY v.vehicle_no, v.vehicle_name
      ORDER BY v.vehicle_no
      `,
            [startDate, endDate],
        );
    }
}
