import { Controller, Get, Post, Put, Delete, Body, Param, Req, Patch } from "@nestjs/common";
import { GuestRoomService } from "./guest-room.service";
import { CreateGuestRoomDto } from "./dto/create-guest-room.dto";
import { UpdateGuestRoomDto } from "./dto/update-guest-room.dto";
import { getRequestContext } from "common/utlis/request-context.util";

@Controller("guest-room")
export class GuestRoomController {
  constructor(private readonly service: GuestRoomService) {}
  //Room Management page - table view
  @Get('overview')
  getOverview() {
    return this.service.getRoomOverview();
  }

  //Room Management page - active guests dropdown
  @Get('active-guests')
  getActiveGuests() {
    return this.service.activeGuestsDropDown();
  }

  //Room Management page - vacate
  @Patch(':id/vacate')
  vacateRoom(@Param('id') id: string, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.vacate(id, user, ip);
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
  create(@Body() dto: CreateGuestRoomDto, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.create(dto, user, ip);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateGuestRoomDto, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.update(id, dto, user, ip);
  }

  @Delete(":id")
  softDelete(@Param("id") id: string, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.softDelete(id, user, ip);
  }
}
