import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Req
} from "@nestjs/common";
import { GuestFoodService } from "./guest-food.service";
import { CreateGuestFoodDto } from "./dto/create-guest-food-dto";
import { UpdateGuestFoodDto } from "./dto/update-guest-food-dto";

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
}
