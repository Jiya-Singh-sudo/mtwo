import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ActivityLogService } from "./activity-log.service";
import { JwtAuthGuard } from "../gaurds/jwt/jwt.guard";
import { PermissionsGuard } from "../gaurds/permissions/permissions.guard";
import { Permissions } from "../decorators/permissions/permissions.decorator";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('audit.view')
@Controller('activity-log')
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}
  // @Get()
  // findRecent(
  //   @Query('limit') limit = 10,
  // ) {
  //   return this.activityLogService.findRecent(Number(limit));
  // }
  /** GET /activity-log/recent?limit=5 */
  @Get('recent')
  async getRecentActivity(@Query('limit') limit?: string) {
    return this.activityLogService.getRecentActivity(
      limit ? Number(limit) : 5
    );
  }
  @Get('verify')
  @Permissions('audit.view')
  async verifyChain() {
    return this.activityLogService.verifyChain();
  }

  /** Full audit log search */
  @Get()
  async search(
    @Query('module') module?: string,
    @Query('action') action?: string,
    @Query('performedBy') performedBy?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.activityLogService.search({
      module,
      action,
      performedBy,
      from,
      to,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }
}
