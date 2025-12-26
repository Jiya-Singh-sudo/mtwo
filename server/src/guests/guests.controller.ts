import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { GuestsService } from './guests.service';
import { CreateGuestDto } from './dto/create-guests.dto';
import { UpdateGuestDto } from './dto/update-guests.dto';

@Controller('guests')
export class GuestsController {
  constructor(private readonly service: GuestsService) { }

  @Get('active')
  async active() {
    return this.service.findActiveGuestsWithInOut();
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
    return this.service.update(Number(id), dto, user, ip);  
  }

  // soft delete guest + optionally soft delete inout
  @Delete(':id')
  async softDelete(@Param('id') id: string, @Req() req: any) {
    const user = req.user?.username || 'system';
    const ip = req.ip || '0.0.0.0';
    // soft delete all active inout rows for this guest
    await this.service.softDeleteAllGuestInOuts(Number(id), user, ip);
    return this.service.softDeleteGuest(Number(id), user, ip);
  }
    @Get('checked-in-without-vehicle')
  async getCheckedInWithoutVehicle() {
    return this.service.findCheckedInWithoutVehicle();
  }


}
