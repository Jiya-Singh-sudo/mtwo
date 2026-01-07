import { Controller, Get, Post, Put, Param, Body, Req } from "@nestjs/common";
import { GuestHousekeepingService } from "./guest-housekeeping.service";
import { CreateGuestHousekeepingDto } from "./dto/create-guest-housekeeping.dto";
import { UpdateGuestHousekeepingDto } from "./dto/update-guest-housekeeping.dto";

@Controller("guest-housekeeping")
export class GuestHousekeepingController {
  constructor(private readonly service: GuestHousekeepingService) {}

  private extractIp(req: any): string {
    let ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      "";
    ip = ip.toString().replace("::ffff:", "");
    if (ip.includes(",")) ip = ip.split(",")[0].trim();
    return ip === "::1" ? "127.0.0.1" : ip;
  }

  @Get()
  findActive() {
    return this.service.findAll(true);
  }

  @Post("assignRoomBoy")
  create(@Body() dto: CreateGuestHousekeepingDto, @Req() req: any) {
    const user = req.headers["x-user"] || "system";
    const ip = this.extractIp(req);
    return this.service.create(dto, user, ip);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateGuestHousekeepingDto, @Req() req: any) {
    const user = req.headers["x-user"] || "system";
    const ip = this.extractIp(req);
    return this.service.update(id, dto, user, ip);
  }

  @Put(":id/cancel")
  cancel(@Param("id") id: string) {
    return this.service.cancel(id);
  }
}
