import {
  Controller, Get, Post, Put, Delete, Patch,
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
    let ip =
      req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      '';
    ip = ip.replace('::ffff:', '').split(',')[0];
    return ip === '::1' ? '127.0.0.1' : ip;
  }

  // ASSIGN DRIVER
  @Post("assign")
  assign(@Body() dto: AssignGuestDriverDto, @Req() req: any) {
    const user = req.headers['x-user'] || 'system';
    const ip = this.extractIp(req);
    return this.service.assignDriver(dto, user, ip);
  }

  // CREATE FULL TRIP
  @Post()
  create(@Body() dto: CreateGuestDriverDto, @Req() req: any) {
    const user = req.headers['x-user'] || 'system';
    const ip = this.extractIp(req);
    return this.service.createTripStandalone(dto, user, ip);
  }

  // GET ACTIVE DRIVER
  @Get("active/:guestId")
  active(@Param("guestId") guestId: string) {
    return this.service.findActiveByGuest(guestId);
  }
  //   @Patch('editTripStatus/:id')
  // updateTrip(
  //   @Param('id') id: string,
  //   @Body() dto: UpdateGuestDriverDto,
  //   @Req() req: any
  // ) {
  //   const user = req.user?.username || 'system';
  //   const ip = req.ip || '0.0.0.0';
  //   return this.service.updateTrip(id, dto, user, ip);
  // }


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

  // @Put(":id")
  // update(@Param("id") id: string, @Body() dto: UpdateGuestDriverDto, @Req() req: any) {
  //   const user = req.headers["x-user"] || "system";
  //   return this.service.update(id, dto, user, this.extractIp(req));
  // }

  // Revise trip (CLOSE + INSERT)
  @Post('revise/:guestDriverId')
  async reviseTrip(
    @Param('guestDriverId') oldGuestDriverId: string,
    @Body() dto: Partial<CreateGuestDriverDto>,
    @Req() req: any
  ) {
    const user = req.headers["x-user"] || "system";
    const ip = this.extractIp(req);

    return this.service.reviseTrip(
      oldGuestDriverId,
      dto,
      user,
      ip
    );
  }

  @Delete(":id")
  closeTrip(@Param("id") id: string, @Req() req: any) {
    const user = req.headers["x-user"] || "system";
    return this.service.closeTrip(id, user, this.extractIp(req));
  }
}
