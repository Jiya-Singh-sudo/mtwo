import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query } from '@nestjs/common';
import { GuestsService } from './guests.service';
import { CreateGuestDto } from './dto/create-guests.dto';
import { UpdateGuestDto } from './dto/update-guests.dto';

@Controller('guests')
export class GuestsController {
  constructor(private readonly service: GuestsService) { }

  // @Get('active')
  // async active() {
  //   return this.service.findActiveGuestsWithInOut();
  // }
  @Get('active')
  async activeRows(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findActiveGuestsWithInOut({
      page: Number(page),
      limit: Number(limit),
      search,
      status,
    });
  }

  // guests.controller.ts
  @Get('status-counts')
  async getStatusCounts() {
    return await this.service.getGuestStatusCounts();
  } 

  // create full guest (guest + designation + inout)
  @Post()
  async createFull(@Body() body: { guest: CreateGuestDto; designation?: any; inout?: any }, @Req() req: any) {
    const user = req.user?.username || 'system';
    const ip = req.ip || req.connection?.remoteAddress || '0.0.0.0';
    return this.service.createFullGuest(body, user, ip);
  }

  // patch guest data
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateGuestDto, @Req() req: any) {
    const user = req.user?.username || 'system';
    const ip = req.ip || '0.0.0.0';
    return this.service.update(String(id), dto, user, ip);  
  }

  // soft delete guest + optionally soft delete inout
  @Delete(':id')
  async softDelete(@Param('id') id: string, @Req() req: any) {
    const user = req.user?.username || 1;
    const ip = req.ip || '0.0.0.0';
    // soft delete all active inout rows for this guest
    await this.service.softDeleteGuest(String(id), user, ip);
    return this.service.softDeleteGuest(String(id), user, ip);
  }
    @Get('checked-in-without-vehicle')
  async getCheckedInWithoutVehicle() {
    return this.service.findCheckedInWithoutVehicle();
  }

  @Patch('inout/:id/exit')
  async exitGuest(@Param('id') id: string, @Req() req: any) {
    return this.service.updateGuestInOut(id, { status: 'Exited' });
  }

  @Patch('inout/:id/cancel')
  async cancelGuest(@Param('id') id: string, @Req() req: any) {
    return this.service.updateGuestInOut(id, { status: 'Cancelled' });
  }

}
