import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req,} from '@nestjs/common';
import { GuestMessengerService } from './guest-messeneger.service';
import { CreateGuestMessengerDto } from './dto/create-guest-messenger.dto';
import { UpdateGuestMessengerDto } from './dto/update-guest-messenger.dto';
import { GuestMessengerTableQueryDto } from './dto/guest-messenger-table-query.dto';

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

  @Post()
  create(@Body() dto: CreateGuestMessengerDto, @Req() req: any) {
    return this.service.create(
      dto,
      req.headers['x-user'] || 'system',
      this.extractIp(req),
    );
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGuestMessengerDto,
    @Req() req: any,
  ) {
    return this.service.update(
      id,
      dto,
      req.headers['x-user'] || 'system',
      this.extractIp(req),
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
