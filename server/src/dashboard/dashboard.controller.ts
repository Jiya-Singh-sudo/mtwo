import { Controller, Get, Query } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  // @Get("overview")
  // getOverview() {
  //   return this.service.getOverview();
  // }
  // @Get("live-full")
  // getFullLive() {
  //   return this.service.getFullLiveDashboard();
  // }
  @Get("overview")
  getOverview(
    @Query("from") from?: string,
    @Query("to") to?: string
  ) {
    return this.service.getOverview(from, to);
  }

  @Get("live-full")
  getFullLive(
    @Query("from") from?: string,
    @Query("to") to?: string
  ) {
    return this.service.getFullLiveDashboard(from, to);
  }
}
