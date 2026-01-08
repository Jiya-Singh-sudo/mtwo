import { Controller, Get, Query } from "@nestjs/common";
import { ActivityLogService } from "./activity-log.service";

@Controller("activity-log")
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  /** GET /activity-log/recent?limit=5 */
  @Get("recent")
  async getRecentActivity(
    @Query("limit") limit?: string
  ) {
    const parsedLimit = limit ? Number(limit) : 5;
    return this.activityLogService.getRecentActivity(parsedLimit);
  }
}
