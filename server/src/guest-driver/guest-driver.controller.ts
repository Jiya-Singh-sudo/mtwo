import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Req
} from "@nestjs/common";
import { GuestDriverService } from "./guest-driver.service";
import { UpdateGuestDriverDto } from "./dto/update-guest-driver.dto";
import { AssignGuestDriverDto } from "./dto/assign-guest-driver.dto";
import { CreateGuestDriverDto } from "./dto/create-guest-driver.dto";

@Controller("guest-driver")
export class GuestDriverController {
  constructor(private readonly service: GuestDriverService) { }

  private extractIp(req: any): string {
    const raw =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip || "";
    return raw.replace("::ffff:", "").split(",")[0];
  }

    // ASSIGN DRIVER
  @Post("assign")
  assign(@Body() dto: AssignGuestDriverDto, @Req() req: any) {
    return this.service.assignDriver(dto, req.headers["x-user"], this.extractIp(req));
  }

  // CREATE FULL TRIP
  @Post()
  create(@Body() dto: CreateGuestDriverDto, @Req() req: any) {
    return this.service.createTrip(dto, req.headers["x-user"], this.extractIp(req));
  }

  // GET ACTIVE DRIVER
  @Get("active/:guestId")
  active(@Param("guestId") guestId: string) {
    return this.service.findActiveByGuest(guestId);
  }

  @Get()
  getActive() {
    return this.service.findAll(true);
  }
  @Get("activeguests/:guestId")
  getActiveByGuest(@Param("guestId") guestId: string) {
    return this.service.findActiveByGuest(guestId);
  }

  @Get("all")
  getAll() {
    return this.service.findAll(false);
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
