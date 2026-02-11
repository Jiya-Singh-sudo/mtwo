// server/src/modules/guest-liasoning-officer/guest-liasoning-officer.controller.ts

import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Req,
} from '@nestjs/common';
import { GuestLiasoningOfficerService } from './guest-liasoning-officer.service';
import {
  CreateGuestLiasoningOfficerDto,
  UpdateGuestLiasoningOfficerDto,
} from './dto/guest-liasoning-officer.dto';

@Controller('guest-liasoning-officer')
export class GuestLiasoningOfficerController {
  constructor(private readonly service: GuestLiasoningOfficerService) {}

  @Post()
  create(@Body() dto: CreateGuestLiasoningOfficerDto, @Req() req: any) {
    return this.service.create(dto, req.user?.userId, req.ip);
  }

  @Get(':guestId')
  findByGuest(@Param('guestId') guestId: string) {
    return this.service.findByGuest(guestId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGuestLiasoningOfficerDto,
    @Req() req: any
  ) {
    return this.service.update(id, dto, req.user?.userId, req.ip);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.service.softDelete(id, req.user?.userId, req.ip);
  }
}
