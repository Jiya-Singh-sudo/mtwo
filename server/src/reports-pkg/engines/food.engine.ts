import { DbClient } from '../interfaces/db-client.interface';
import { ReportCode } from '../registry/report.registry';

export class FoodReportEngine {
    constructor(private readonly db: DbClient) { }

    async run(reportCode: ReportCode, filters: any) {
        switch (reportCode) {

            case ReportCode.FOOD_SERVICE_UTILIZATION:
                return this.foodServiceUtilization(filters);

            default:
                throw new Error(`Unsupported food report: ${reportCode}`);
        }
    }

    /**
     * FOOD & SERVICE UTILIZATION
     *
     * Tables:
     * - t_guest_food
     * - m_food_items
     *
     * Output:
     * - food name
     * - food type
     * - total orders
     * - total quantity
     * - delivered / pending counts
     */
    private async foodServiceUtilization(filters: any) {
        const startDate =
            filters.startDate ?? '1900-01-01';
        const endDate =
            filters.endDate ?? new Date().toISOString();

        return this.db.query(
            `
      SELECT
        f.food_id,
        f.food_name,
        f.food_type,
        COUNT(gf.guest_food_id) AS total_orders,
        SUM(gf.quantity) AS total_quantity,
        COUNT(gf.guest_food_id)
          FILTER (WHERE gf.delivery_status = 'DELIVERED') AS delivered_orders,
        COUNT(gf.guest_food_id)
          FILTER (WHERE gf.delivery_status IS DISTINCT FROM 'DELIVERED') AS pending_orders
      FROM m_food_items f
      LEFT JOIN t_guest_food gf
        ON gf.food_id = f.food_id
       AND gf.order_datetime BETWEEN $1 AND $2
       AND gf.is_active = true
      WHERE f.is_active = true
      GROUP BY f.food_id, f.food_name, f.food_type
      ORDER BY total_orders DESC, f.food_name
      `,
            [startDate, endDate],
        );
    }
}
