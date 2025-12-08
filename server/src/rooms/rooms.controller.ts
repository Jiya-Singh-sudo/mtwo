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

import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-rooms.dto';
import { UpdateRoomDto } from './dto/update-rooms.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly service: RoomsService) {}

  private extractIp(req: any): string {
    let ip =
      req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      '';

    if (ip === '::1' || ip === '127.0.0.1') return '127.0.0.1';

    ip = ip.toString().replace('::ffff:', '');
    if (ip.includes(',')) ip = ip.split(',')[0].trim();

    return ip;
  }

  @Get()
  findAllActive() {
    return this.service.findAll(true);
  }

  @Get('all')
  findAllIncludingInactive() {
    return this.service.findAll(false);
  }

  @Post()
  create(@Body() dto: CreateRoomDto, @Req() req: any) {
    const user = req.headers['x-user'] || 'system';
    const ip = this.extractIp(req);
    return this.service.create(dto, user, ip);
  }

  @Put(':room_no')
  update(
    @Param('room_no') room_no: string,
    @Body() dto: UpdateRoomDto,
    @Req() req: any,
  ) {
    const user = req.headers['x-user'] || 'system';
    const ip = this.extractIp(req);
    return this.service.update(room_no, dto, user, ip);
  }

  @Delete(':room_no')
  softDelete(@Param('room_no') room_no: string, @Req() req: any) {
    const user = req.headers['x-user'] || 'system';
    const ip = this.extractIp(req);
    return this.service.softDelete(room_no, user, ip);
  }
}
