import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Req
} from "@nestjs/common";
import { GuestDriverService } from "./guest-driver.service";
import { CreateGuestDriverDto } from "./dto/create-guest-driver.dto";
import { UpdateGuestDriverDto } from "./dto/update-guest-driver.dto";

@Controller("guest-driver")
export class GuestDriverController {
  constructor(private readonly service: GuestDriverService) {}

  private extractIp(req: any): string {
    const raw =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip || "";
    return raw.replace("::ffff:", "").split(",")[0];
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
  create(@Body() dto: CreateGuestDriverDto, @Req() req: any) {
    const user = req.headers["x-user"] || "system";
    return this.service.create(dto, user, this.extractIp(req));
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateGuestDriverDto, @Req() req: any) {
    const user = req.headers["x-user"] || "system";
    return this.service.update(id, dto, user, this.extractIp(req));
  }

  @Delete(":id")
  softDelete(@Param("id") id: string, @Req() req: any) {
    const user = req.headers["x-user"] || "system";
    return this.service.softDelete(id, user, this.extractIp(req));
  }
}
