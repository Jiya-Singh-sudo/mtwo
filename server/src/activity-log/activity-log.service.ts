import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

@Injectable()
export class ActivityLogService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Generate Activity Log ID in format:
   * AL001, AL002, AL003, ...
   */
  private async generateActivityLogId(): Promise<string> {
    const sql = `
      SELECT activity_id
      FROM t_activity_log
      ORDER BY activity_id DESC
      LIMIT 1
    `;

    const result = await this.db.query(sql);

    if (result.rows.length === 0) {
      return "AL001";
    }

    const lastId: string = result.rows[0].activity_id;
    const numericPart = lastId.replace("AL", "");
    const nextNumber = (parseInt(numericPart, 10) + 1)
      .toString()
      .padStart(3, "0");

    return `AL${nextNumber}`;
  }

  /**
   * Insert a new activity log entry
   */
  async logActivity(params: {
    message: string;
    module?: string;
    action?: string;
    referenceId?: string;
    performedBy?: string;
    ipAddress?: string;
  }): Promise<string> {
    const activityId = await this.generateActivityLogId();

    await this.db.query(
      `
      INSERT INTO t_activity_log (
        activity_id,
        message,
        module,
        action,
        reference_id,
        performed_by,
        inserted_by,
        inserted_ip
      )
      VALUES ($1, $2, $3, $4, $5, $6, $6, $7)
      `,
      [
        activityId,
        params.message,
        params.module ?? null,
        params.action ?? null,
        params.referenceId ?? null,
        params.performedBy ?? null,
        params.ipAddress ?? null,
      ]
    );

    return activityId;
  }

  /**
   * Fetch recent activity logs (for dashboard)
   */
  async getRecentActivity(limit = 5) {
    const result = await this.db.query(
      `
      SELECT
        activity_id,
        message,
        module,
        action,
        inserted_at AS timestamp
      FROM t_activity_log
      WHERE is_active = TRUE
      ORDER BY inserted_at DESC
      LIMIT $1
      `,
      [limit]
    );

    return result.rows;
  }
}
