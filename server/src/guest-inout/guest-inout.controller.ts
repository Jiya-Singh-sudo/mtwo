import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Req
} from "@nestjs/common";
import { GuestInoutService } from "./guest-inout.service";
import { CreateGuestInoutDto } from "./dto/create-guest-inout.dto";
import { UpdateGuestInoutDto } from "./dto/update-guest-inout.dto";

@Controller("guest-inout")
export class GuestInoutController {
  constructor(private readonly service: GuestInoutService) {}

  private extractIp(req: any): string {
    return (req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      ""
    ).replace("::ffff:", "").split(",")[0];
  }

  @Get()
  findActive() {
    return this.service.findAll(true);
  }

  @Get("all")
  findAll() {
    return this.service.findAll(false);
  }

  @Post()
  create(@Body() dto: CreateGuestInoutDto, @Req() req: any) {
    const user = req.headers["x-user"] || "system";
    const ip = this.extractIp(req);
    return this.service.create(dto, user, ip);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateGuestInoutDto, @Req() req: any) {
    const user = req.headers["x-user"] || "system";
    return this.service.update(id, dto, this.extractIp(req), user);
  }

  @Delete(":id")
  softDelete(@Param("id") id: string, @Req() req: any) {
    const user = req.headers["x-user"] || "system";
    return this.service.softDelete(id, user, this.extractIp(req));
  }
}
