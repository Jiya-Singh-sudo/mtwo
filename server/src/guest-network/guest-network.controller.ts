import { Controller, Get, Post, Put, Delete, Body, Param, Req, Query } from "@nestjs/common";
import { GuestNetworkService } from "./guest-network.service";
import { CreateGuestNetworkDto } from "./dto/create-guest-network.dto";
import { CloseGuestNetworkDto } from "./dto/close-guest-network.dto";
import { GuestNetworkTableQueryDto } from "./dto/guest-network-table-query.dto";
import { UpdateGuestNetworkDto } from "./dto/update-guest-network.dto";
import { getRequestContext } from '../../common/utlis/request-context.util';

@Controller("guest-network")
export class GuestNetworkController {
  constructor(private readonly service: GuestNetworkService) {}
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
  @Get('active-providers')
  getActiveProviders() {
    return this.service.getActiveProviders();
  }
  @Post()
  create(@Body() dto: CreateGuestNetworkDto, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.create(dto, user, ip);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateGuestNetworkDto, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.update(id, dto, user, ip);
  }

  @Post(':id/close')
  closeAndCreateNext(
    @Param('id') id: string,
    @Body() dto: CloseGuestNetworkDto,
    @Req() req: any
  ) {
    const { user, ip } = getRequestContext(req);
    return this.service.closeAndCreateNext(
      id,
      dto,
      user,
      ip
    );
  }

  @Delete(":id")
  softDelete(@Param("id") id: string, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.softDelete(id, user, ip);
  }
}
