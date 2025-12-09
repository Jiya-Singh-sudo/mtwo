import { Controller, Get, Post, Put, Body, Param, Req } from "@nestjs/common";
import { GuestDesignationService } from "./guest-designation.service";
import { CreateGuestDesignationDto } from "./dto/create-guest-designation.dto";
import { UpdateGuestDesignationDto } from "./dto/update-guest-designation.dto";

@Controller("guest-designation")
export class GuestDesignationController {
  constructor(private readonly service: GuestDesignationService) {}

  private extractIp(req: any): string {
    let ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      "";
    ip = ip.toString().replace("::ffff:", "");
    return ip.includes(",") ? ip.split(",")[0].trim() : ip;
  }

  @Get()
  getAll() {
    return this.service.findAll(true);
  }

  @Post()
  create(@Body() dto: CreateGuestDesignationDto, @Req() req: any) {
    const user = req.headers["x-user"] || "system";
    const ip = this.extractIp(req);
    return this.service.create(dto, user, ip);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateGuestDesignationDto, @Req() req: any) {
    const user = req.headers["x-user"] || "system";
    const ip = this.extractIp(req);
    return this.service.update(id, dto, user, ip);
  }
}
