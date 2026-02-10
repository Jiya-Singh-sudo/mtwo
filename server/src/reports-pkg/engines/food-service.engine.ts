import { DbClient } from '../interfaces/db-client.interface';
import { ReportCode } from '../registry/report.registry';

export class FoodServiceReportEngine {
  constructor(private readonly db: DbClient) {}

  async run(
    reportCode: ReportCode,
    filters: { fromDate: string; toDate: string }
  ) {
    switch (reportCode) {
      case ReportCode.FOOD_SERVICE_DAILY_SUMMARY:
      case ReportCode.FOOD_SERVICE_WEEKLY_SUMMARY:
      case ReportCode.FOOD_SERVICE_MONTHLY_SUMMARY:
        return this.foodTransactionReport(filters);

      default:
        throw new Error(`Unsupported food service report: ${reportCode}`);
    }
  }

  private async foodTransactionReport(filters: {
    fromDate: string;
    toDate: string;
  }) {
    const { fromDate, toDate } = filters;

    const result = await this.db.query(
      `
      SELECT
        tgf.guest_food_id,

        tgf.plan_date,
        tgf.meal_type,
        tgf.food_stage,
        tgf.quantity,
        tgf.order_datetime,
        tgf.delivered_datetime,
        tgf.delivery_status,
        tgf.remarks,

        g.guest_name,

        tgf.room_id,

        fi.food_name,
        fi.food_type,

        b.butler_name,
        b.shift

      FROM t_guest_food tgf

      LEFT JOIN m_guest g
        ON g.guest_id = tgf.guest_id
       AND g.is_active = true

      LEFT JOIN m_food_items fi
        ON fi.food_id = tgf.food_id
       AND fi.is_active = true

      LEFT JOIN t_guest_butler tgb
        ON tgb.guest_id = tgf.guest_id
       AND tgb.is_active = true

      LEFT JOIN m_butler b
        ON b.butler_id = tgb.butler_id
       AND b.is_active = true

      WHERE tgf.is_active = true
        AND tgf.plan_date BETWEEN $1 AND $2

      ORDER BY tgf.plan_date DESC, tgf.order_datetime ASC
      `,
      [fromDate, toDate]
    );

    return result?.rows ?? [];
  }
}
