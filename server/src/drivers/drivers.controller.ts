import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  Req,
  Patch,
} from '@nestjs/common';

import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/createDriver.dto';
import { UpdateDriverDto } from './dto/updateDriver.dto';

@Controller('drivers')
export class DriversController {
  constructor(private readonly service: DriversService) {}

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

  @Get('dashboard')
getDashboard() {
  return this.service.getDriverDashboard();
}

@Post()
create(@Body() dto: CreateDriverDto, @Req() req: any) {
  const user = req.user?.username || 'system';
  const ip = req.ip || '0.0.0.0';
  return this.service.create(dto, user, ip);
}
@Patch(':id')
update(
  @Param('id') id: string,
  @Body() dto: UpdateDriverDto,
  @Req() req: any
) {
  const user = req.user?.username || 'system';
  const ip = req.ip || '0.0.0.0';
  return this.service.update(id, dto, user, ip);
}



@Post('assign')
assignDriver(
  @Body() body: { guest_vehicle_id: string; driver_id: string },
  @Req() req: any
) {
  const user = req.user?.username || 'system';
  const ip = req.ip || '0.0.0.0';
  return this.service.assignDriver(body, user, ip);
}

  // GET only active drivers
  @Get()
  findAllActive() {
    return this.service.findAll(true);
  }
  @Get('available')
getAvailableDrivers() {
  return this.service.findAssignableDrivers();
}


  // GET all drivers including inactive
  @Get('all')
  findAll() {
    return this.service.findAll(false);
  }

  // SOFT DELETE
  @Delete(':driver_Name')
  softDelete(@Param('driver_Name') driverName: string, @Req() req: any) {
    const user = req.headers['x-user'] || 'system';
    const ip = this.extractIp(req);
    return this.service.softDelete(driverName, user, ip);
  }
}
