// server/src/modules/guest-liasoning-officer/guest-liasoning-officer.controller.ts
import { Controller, Post, Get, Patch, Delete, Param, Body, Req, Query} from '@nestjs/common';
import { GuestLiasoningOfficerService } from './guest-liasoning-officer.service';
import { CreateGuestLiasoningOfficerDto, UpdateGuestLiasoningOfficerDto,} from './dto/guest-liasoning-officer.dto';
import { getRequestContext } from 'common/utlis/request-context.util';

@Controller('guest-liasoning-officer')
export class GuestLiasoningOfficerController {
  constructor(private readonly service: GuestLiasoningOfficerService) {}

  @Get('table')
  getTable(@Query() query: any) {
    return this.service.getGuestOfficerTable({
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }
  @Post()
  create(@Body() dto: CreateGuestLiasoningOfficerDto, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.create(dto, user, ip);
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
    const { user, ip } = getRequestContext(req);
    return this.service.update(id, dto, user, ip);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.softDelete(id, user, ip);
  }
}
