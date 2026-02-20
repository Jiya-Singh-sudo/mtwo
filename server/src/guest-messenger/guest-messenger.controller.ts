import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, } from '@nestjs/common';
import { GuestMessengerService } from './guest-messenger.service';
import { CreateGuestMessengerDto } from '../guest-messenger/dto/create-guest-messenger.dto';
import { UnassignGuestMessengerDto } from '../guest-messenger/dto/unassign-guest-messenger.dto';
import { GuestMessengerTableQueryDto } from '../guest-messenger/dto/guest-messenger-table-query.dto';
import { GuestNetworkTableQueryDto } from '../guest-messenger/dto/guest-network-table.dto';
import { getRequestContext } from '../../common/utlis/request-context.util';

@Controller('guest-messenger')
export class GuestMessengerController {
  constructor(private readonly service: GuestMessengerService) { }

  @Get('network-table')
  async getGuestNetworkTable(
    @Query() query: GuestNetworkTableQueryDto,
  ) {
    return this.service.getGuestNetworkTable(query);
  }

  @Post("assign")
  create(@Body() dto: CreateGuestMessengerDto, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.create(dto, user, ip);
  }

  // @Put(':id')
  // update(
  //   @Param('id') id: string,
  //   @Body() dto: UpdateGuestMessengerDto,
  //   @Req() req: any,
  // ) {
  //   return this.service.update(
  //     id,
  //     dto,
  //     req.headers['x-user'] || 'system',
  //     this.extractIp(req),
  //   );
  // }

  @Post(':id/unassign')
  unassign(
    @Param('id') id: string,
    @Body() dto: UnassignGuestMessengerDto,
    @Req() req: any
  ) {
    const { user, ip } = getRequestContext(req);
    return this.service.unassign(id, user, ip, dto.remarks);
  }

  @Delete(':id')
  softDelete(@Param('id') id: string, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.softDelete(id, user, ip);
  }

  @Get('table')
  getTable(@Query() query: GuestMessengerTableQueryDto) {
    return this.service.getGuestMessengerTable(query);
  }
}
