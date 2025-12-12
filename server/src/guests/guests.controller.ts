import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';

import { GuestsService } from './guests.service';
import { CreateGuestDto } from './dto/create-guests.dto';
import { UpdateGuestDto } from './dto/update-guests.dto';

@Controller('guests')
export class GuestsController {
  constructor(private readonly service: GuestsService) {}

  private extractIp(req: any): string {
    let ip =
      req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      '';

    if (ip === '::1' || ip === '127.0.0.1') {
      return '127.0.0.1';
    }

    ip = ip.toString().replace('::ffff:', '');

    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }

    return ip;
  }

  @Get()
  findAllActive() {
    return this.service.findAllWithInOut();
  }
  @Get('guestsWithInOut')
  findAllWithInOut() {
    return this.service.findAllWithInOut();
  }

  // @Get('all')
  // findAllIncludingInactive() {
  //   return this.service.findAl(false);
  // }

  @Post()
  async create(@Body() dto: CreateGuestDto, @Req() req: any) {
    const user = req.headers['x-user'] || 'system';
    const ip = this.extractIp(req);
    const guest = await this.service.create(dto, user, ip)
    return guest;
  }

  // Updating by guest_name (frontend sends name)
  @Put(':guest_name')
  update(
    @Param('guest_name') name: string,
    @Body() dto: UpdateGuestDto,
    @Req() req: any,
  ) {
    const user = req.headers['x-user'] || 'system';
    const ip = this.extractIp(req);
    return this.service.update(name, dto, user, ip);
  }

  @Delete(':guest_name')
  softDelete(@Param('guest_name') name: string, @Req() req: any) {
    const user = req.headers['x-user'] || 'system';
    const ip = this.extractIp(req);
    return this.service.softDelete(name, user, ip);
  }
}
