import { Controller, Post, Get, Delete, Param, Body, Req,} from '@nestjs/common';
import { GuestMedicalContactService } from './guest-medical-contact.service';
import { CreateGuestMedicalContactDto } from './dto/guest-medical-contact.dto';
import { getRequestContext } from 'common/utlis/request-context.util';

@Controller('guest-medical-contact')
export class GuestMedicalContactController {
  constructor(private readonly service: GuestMedicalContactService) {}

  @Post()
  create(@Body() dto: CreateGuestMedicalContactDto, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.create(dto, user, ip);
  }

  @Get(':guestId')
  findByGuest(@Param('guestId') guestId: string) {
    return this.service.findByGuest(guestId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.softDelete(id, user, ip);
  }
}
