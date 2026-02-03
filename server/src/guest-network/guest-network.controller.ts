import { Controller, Get, Post, Put, Delete, Body, Param, Req, Query } from "@nestjs/common";
import { GuestNetworkService } from "./guest-network.service";
import { CreateGuestNetworkDto } from "./dto/create-guest-network.dto";
import { CloseGuestNetworkDto } from "./dto/close-guest-network.dto";
import { GuestNetworkTableQueryDto } from "./dto/guest-network-table-query.dto";
import { UpdateGuestNetworkDto } from "./dto/update-guest-network.dto";
@Controller("guest-network")
export class GuestNetworkController {
  constructor(private readonly service: GuestNetworkService) {}

  private extractIp(req: any): string {
    let ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      "";
    ip = ip.toString().replace("::ffff:", "");
    if (ip.includes(",")) ip = ip.split(",")[0].trim();
    if (ip === "::1") ip = "127.0.0.1";
    return ip;
  }

  @Get('table')
  getTable(@Query() query: GuestNetworkTableQueryDto) {
    return this.service.getGuestNetworkTable(query);
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
  create(@Body() dto: CreateGuestNetworkDto, @Req() req: any) {
    const user = req.headers["x-user"] || "system";
    const ip = this.extractIp(req);
    return this.service.create(dto, user, ip);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateGuestNetworkDto, @Req() req: any) {
    const user = req.headers["x-user"] || "system";
    const ip = this.extractIp(req);
    return this.service.update(id, dto, user, ip);
  }

  @Post(':id/close')
  closeAndCreateNext(
    @Param('id') id: string,
    @Body() dto: CloseGuestNetworkDto,
    @Req() req: any
  ) {
    const user = req.headers['x-user'] || 'system';
    return this.service.closeAndCreateNext(
      id,
      dto,
      user,
      this.extractIp(req)
    );
  }


  @Delete(":id")
  softDelete(@Param("id") id: string, @Req() req: any) {
    const user = req.headers["x-user"] || "system";
    const ip = this.extractIp(req);
    return this.service.softDelete(id, user, this.extractIp(req));
  }
}
