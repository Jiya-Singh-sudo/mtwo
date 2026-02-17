import { Controller, Post, Body, Req, Patch, Param } from '@nestjs/common';
import { GuestDesignationService } from './guest-designation.service';
import { CreateGuestDesignationDto } from './dto/create-guest-designation.dto';
import { UpdateGuestDesignationDto } from './dto/update-guest-designation.dto';

@Controller('guest-designation')
export class GuestDesignationController {
  constructor(private svc: GuestDesignationService) {}
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
  @Post()
  create(@Body() dto: CreateGuestDesignationDto, @Req() req: any) {
    const user = req.user?.user_id || 'system';
    const ip = this.extractIp(req);
    return this.svc.create(dto, user, ip);
  }

  @Patch(':gdId')
  update(@Param('gdId') gdId: string, @Body() dto: UpdateGuestDesignationDto, @Req() req: any) {
    const user = req.user?.user_id || 'system';
    const ip = this.extractIp(req);
    return this.svc.update(gdId, dto, user, ip);
  }
}
