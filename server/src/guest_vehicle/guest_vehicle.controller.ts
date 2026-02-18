import { Controller, Get, Post, Patch, Param, Body, Req } from '@nestjs/common';
import { GuestVehicleService } from './guest_vehicle.service';
import { CreateGuestVehicleDto } from './dto/create-guest-vehicle.dto';
import { UpdateGuestVehicleDto } from './dto/update-guest-vehicle.dto';
import { getRequestContext } from '../../common/utlis/request-context.util';

@Controller('guest-vehicle')
export class GuestVehicleController {
  constructor(private readonly service: GuestVehicleService) {}
  @Get('guests/checked-in-without-vehicle')
  findGuestsWithoutVehicle() {
    return this.service.findCheckedInGuestsWithoutVehicle();
  }

  @Get("by-guest/:guestId")
  getByGuest(@Param("guestId") guestId: string) {
    return this.service.findActiveByGuest(guestId);
  }

  // @Patch('editVehicleAssignment/:id')
  // updateAssignment(
  //   @Param('id') id: string,
  //   @Body() dto: UpdateGuestVehicleDto,
  //   @Req() req: any
  // ) {
  //   const user = req.user?.username || 'system';
  //   const ip = req.ip || '0.0.0.0';
  //   return this.service.updateVehicleAssignment(id, dto, user, ip);
  // }

  @Get('vehicles/assignable')
  findAssignableVehicles() {
    return this.service.findAssignableVehicles();
  }

  @Get('guests/:guestId/vehicles')
  findVehiclesByGuest(@Param('guestId') guestId: string) {
    return this.service.findVehiclesByGuest(String(guestId));
  }

  @Post('assign')
  assignVehicle(@Body() dto: CreateGuestVehicleDto, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.assignVehicle(dto, user, ip);
  }

  @Patch('guest-vehicle/:id/release')
  releaseVehicle(@Param('id') id: string, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.releaseVehicle(id, user, ip);
  }
  @Get('without-driver')
  getGuestVehiclesWithoutDriver() {
    return this.service.getWithoutDriver();
  }
    // Reassign vehicle (CLOSE + INSERT)
  @Post('reassign/:guestVehicleId')
  async reassignVehicle(
    @Param('guestVehicleId') oldGuestVehicleId: string,
    @Body() dto: CreateGuestVehicleDto,
    @Req() req: any
  ) {
    const { user, ip } = getRequestContext(req);
    return this.service.reassignVehicle(
      oldGuestVehicleId,
      dto,
      user,
      ip
    );
  }
}
