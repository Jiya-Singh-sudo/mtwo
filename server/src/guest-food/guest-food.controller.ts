import { Controller, Get, Post, Put, Delete, Body, Param, Req, Query } from "@nestjs/common";
import { GuestFoodService } from "./guest-food.service";
import { CreateGuestFoodDto } from "./dto/create-guest-food-dto";
import { UpdateGuestFoodDto } from "./dto/update-guest-food-dto";
import { GuestFoodTableQueryDto } from "./dto/guest-food-table.dto";

@Controller("guest-food")
export class GuestFoodController {
  constructor(private readonly service: GuestFoodService) {}

  private extractIp(req: any): string {
    return (req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      ""
    ).replace("::ffff:", "").split(",")[0];
  }
  @Get("dashboard")
  getDashboard() {
    return this.service.getDashboardStats();
  }
  @Get("schedule/today")
  getTodaySchedule() {
    return this.service.getTodaySchedule();
  }

@Get("plan/today")
getTodayMealPlanOverview() {
  return this.service.getTodayMealPlanOverview();
}

  @Get()
  getActive() {
    return this.service.findAll(true);
  }

  @Get("all")
  getAll() {
    return this.service.findAll(false);
  }

  @Post()
  create(@Body() dto: CreateGuestFoodDto, @Req() req: any) {
    const user = req.headers["x-user"] || "system";
    return this.service.create(dto, user, this.extractIp(req));
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateGuestFoodDto, @Req() req: any) {
    const user = req.headers["x-user"] || "system";
    return this.service.update(id, dto, user, this.extractIp(req));
  }

  @Delete(":id")
  softDelete(@Param("id") id: string, @Req() req: any) {
    const user = req.headers["x-user"] || "system";
    return this.service.softDelete(id, user, this.extractIp(req));
  }
  @Get("guests/today")
  getTodayOrders() {
    return this.service.getTodayGuestOrders();
  }
  @Get('table')
  getGuestFoodTable(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search = '',
    @Query('status') status?: string,
    @Query('mealType') mealType?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'desc',
    @Query('foodStatus') foodStatus?: 'SERVED' | 'NOT_SERVED',
    @Query('entryDateFrom') entryDateFrom?: string,
    @Query('entryDateTo') entryDateTo?: string
  ) {
    return this.service.getGuestFoodTable({
      page: Number(page),
      limit: Number(limit),
      search,
      status: status as GuestFoodTableQueryDto['status'],
      mealType: mealType as GuestFoodTableQueryDto['mealType'],
      sortBy: sortBy as GuestFoodTableQueryDto['sortBy'],
      sortOrder,
      foodStatus,
      entryDateFrom,
      entryDateTo
    });
  }

}
