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

import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Controller('vehicles')
export class VehiclesController {
    constructor(private readonly service: VehiclesService) {}

        private extractIp(req: any): string {
            let ip =
            req.headers['x-forwarded-for'] ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            req.ip ||
            '';
            // Fix IPv6 localhost (::1)
            if (ip === '::1' || ip === '127.0.0.1') {
            return '127.0.0.1';
            }
            // Remove IPv6 prefix if present
            ip = ip.toString().replace('::ffff:', '');
            // If x-forwarded-for contains multiple IPs, take the first one
            if (ip.includes(',')) {
            ip = ip.split(',')[0].trim();
            }
            return ip;
  }
  @Get()
  findAll() {
    return this.service.findAll(true);  // only active roles
  }
  @Get('all')
  findAllIncludingInactive() {
    return this.service.findAll(false); // active + inactive
  }

    @Post()
    create(@Body() dto: CreateVehicleDto, @Req() req: any) {
      const user = req.headers['x-user'] || 'system';
      const ip = this.extractIp(req);
      return this.service.create(dto, user, ip);
    }
  
    @Put(':role_id')
    update(
      @Param('role_id') id: string,
      @Body() dto: UpdateVehicleDto,
      @Req() req: any,
    ) {
      const user = "admin";
      const ip = this.extractIp(req);
      return this.service.update(id, dto, user, ip);
    }
  
    // SOFT DELETE
    @Delete(':role_id')
    softDelete(@Param('role_id') id: string, @Req() req: any) {
      const user = req.headers['x-user'] || 'system';
      const ip = this.extractIp(req);
      return this.service.softDelete(id, user, ip);
    }
}

