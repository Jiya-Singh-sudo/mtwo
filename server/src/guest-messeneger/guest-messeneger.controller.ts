import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req,} from '@nestjs/common';
import { GuestMessengerService } from './guest-messeneger.service';
import { CreateGuestMessengerDto } from './dto/create-guest-messenger.dto';
import { UnassignGuestMessengerDto } from './dto/unassign-guest-messenger.dto';
import { GuestMessengerTableQueryDto } from './dto/guest-messenger-table-query.dto';
import { GuestNetworkTableQueryDto } from './dto/guest-network-table.dto';

@Controller('guest-messenger')
export class GuestMessengerController {
  constructor(private readonly service: GuestMessengerService) {}

  private extractIp(req: any): string {
    let ip =
      req.headers['x-forwarded-for'] ||
      req.socket?.remoteAddress ||
      req.ip ||
      '';
    return ip.replace('::ffff:', '').split(',')[0];
  }
  @Get('network-table')
  async getGuestNetworkTable(
    @Query() query: GuestNetworkTableQueryDto,
  ) {
    return this.service.getGuestNetworkTable(query);
  }

  @Post()
  create(@Body() dto: CreateGuestMessengerDto, @Req() req: any) {
    return this.service.create(
      dto,
      req.headers['x-user'] || 'system',
      this.extractIp(req),
    );
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
    return this.service.unassign(
      id,
      req.headers['x-user'] || 'system',
      this.extractIp(req),
      dto.remarks
    );
  }

  @Delete(':id')
  softDelete(@Param('id') id: string, @Req() req: any) {
    return this.service.softDelete(
      id,
      req.headers['x-user'] || 'system',
      this.extractIp(req),
    );
  }

  @Get('table')
  getTable(@Query() query: GuestMessengerTableQueryDto) {
    return this.service.getGuestMessengerTable(query);
  }
}
