import { Controller, Post, Body, Req, Patch, Param } from '@nestjs/common';
import { GuestDesignationService } from './guest-designation.service';
import { CreateGuestDesignationDto } from './dto/create-guest-designation.dto';
import { UpdateGuestDesignationDto } from './dto/update-guest-designation.dto';

@Controller('guest-designation')
export class GuestDesignationController {
  constructor(private svc: GuestDesignationService) {}

  @Post()
  create(@Body() dto: CreateGuestDesignationDto, @Req() req: any) {
    const user = req.user?.user_id || 'system';
    const ip = req.ip;
    return this.svc.create(dto, user, ip);
  }

  @Patch(':gdId')
  update(@Param('gdId') gdId: string, @Body() dto: UpdateGuestDesignationDto, @Req() req: any) {
    const user = req.user?.user_id || 'system';
    const ip = req.ip;
    return this.svc.update(gdId, dto, user, ip);
  }
}
