import { Controller, Get, Post, Put, Delete, Body, Param, Req } from "@nestjs/common";
import { GuestButlerService } from "./guest-butler.service";
import { CreateGuestButlerDto } from "./dto/create-guest-butler.dto";
import { UpdateGuestButlerDto } from "./dto/update-guest-butler.dto";
import { getRequestContext } from "common/utlis/request-context.util";

@Controller("guest-butler")
export class GuestButlerController {
  constructor(private readonly service: GuestButlerService) {}
  @Get()
  getActive() {
    return this.service.findAll(true);
  }

  @Get("all")
  getAll() {
    return this.service.findAll(false);
  }

  @Post()
  create(@Body() dto: CreateGuestButlerDto, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.create(dto, user, ip);
  }

  // @Put(":id")
  // update(@Param("id") id: string, @Body() dto: UpdateGuestButlerDto, @Req() req: any) {
  //   const user = req.headers["x-user"] || "system";
  //   return this.service.update(id, dto, user, this.extractIp(req));
  // }
  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateGuestButlerDto,
    @Req() req: any
  ) {
    const { user, ip } = getRequestContext(req);
    return this.service.update(id, dto, user, ip);
  }

  @Delete(":id")
  softDelete(@Param("id") id: string, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.softDelete(id, user, ip);
  }
}
