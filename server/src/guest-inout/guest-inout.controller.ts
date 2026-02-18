import { Controller, Post, Body, Req, Patch, Param, Get } from '@nestjs/common';
import { GuestInoutService } from './guest-inout.service';
import { CreateGuestInOutDto } from './dto/create-guest-inout.dto';
import { UpdateGuestInoutDto } from './dto/update-guest-inout.dto';
import { getRequestContext } from 'common/utlis/request-context.util';

@Controller('guest-inout')
export class GuestInoutController {
  constructor(private svc: GuestInoutService) {}

  @Post()
  create(@Body() dto: CreateGuestInOutDto, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.svc.create(dto, user, ip);
  }

  @Patch(':inoutId')
  update(@Param('inoutId') inoutId: string, @Body() dto: UpdateGuestInoutDto, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.svc.update(inoutId, dto, user, ip);
  }

  @Patch(':inoutId/soft-delete')
  softDelete(@Param('inoutId') inoutId: string, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.svc.softDelete(inoutId, user, ip);
  }

  @Get('active')
  findAllActive() {
    return this.svc.findAllActive();
  }
}
