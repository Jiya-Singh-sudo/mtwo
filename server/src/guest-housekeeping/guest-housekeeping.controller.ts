import { Controller, Get, Post, Put, Param, Body, Req } from "@nestjs/common";
import { GuestHousekeepingService } from "./guest-housekeeping.service";
import { CreateGuestHousekeepingDto } from "./dto/create-guest-housekeeping.dto";
import { UpdateGuestHousekeepingDto } from "./dto/update-guest-housekeeping.dto";
import { getRequestContext } from "common/utlis/request-context.util";

@Controller("guest-housekeeping")
export class GuestHousekeepingController {
  constructor(private readonly service: GuestHousekeepingService) {}
  @Get()
  findActive() {
    return this.service.findAll(true);
  }

  @Post("assignRoomBoy")
  create(@Body() dto: CreateGuestHousekeepingDto, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.create(dto, user, ip);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateGuestHousekeepingDto, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.update(id, dto, user, ip);
  }

  @Put(":id/cancel")
  cancel(@Param("id") id: string, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.cancel(id, user, ip);
  }
}
