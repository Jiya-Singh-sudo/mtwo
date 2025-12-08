import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  Req,
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

  // GET only active drivers
  @Get()
  findAllActive() {
    return this.service.findAll(true);
  }

  // GET all drivers including inactive
  @Get('all')
  findAll() {
    return this.service.findAll(false);
  }

  // CREATE
  @Post()
  create(@Body() dto: CreateDriverDto, @Req() req: any) {
    const user = req.headers['x-user'] || 'system';
    const ip = this.extractIp(req);
    return this.service.create(dto, user, ip);
  }

  // UPDATE
  @Put(':driver_name')
  update(
    @Param('driver_name') driverName: string,
    @Body() dto: UpdateDriverDto,
    @Req() req: any,
  ) {
    const user = req.headers['x-user'] || 'system';
    const ip = this.extractIp(req);
    return this.service.update(driverName, dto, user, ip);
  }

  // SOFT DELETE
  @Delete(':driver_Name')
  softDelete(@Param('driver_Name') driverName: string, @Req() req: any) {
    const user = req.headers['x-user'] || 'system';
    const ip = this.extractIp(req);
    return this.service.softDelete(driverName, user, ip);
  }
}
