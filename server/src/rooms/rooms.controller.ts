import { Controller, Get, Post, Put, Delete, Body, Param, Req } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-rooms.dto';
import { UpdateRoomDto } from './dto/update-rooms.dto';
import { getRequestContext } from 'common/utlis/request-context.util';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly service: RoomsService) {}

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
    const { user, ip } = getRequestContext(req);
    return this.service.create(dto, user, ip);
  }

  @Put(':roomId')
  update(
    @Param('roomId') room_id: string,
    @Body() dto: UpdateRoomDto,
    @Req() req: any,
  ) {
    const { user, ip } = getRequestContext(req);
    return this.service.update(room_id, dto, user, ip);
  }

  @Delete(':room_id')
  softDelete(@Param('room_id') room_id: string, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.softDelete(room_id, user, ip);
  }
}
