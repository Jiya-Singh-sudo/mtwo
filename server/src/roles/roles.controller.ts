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

import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly service: RolesService) {}

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
    return this.service.findAll(true);
  }

  @Get('all')
  findAllIncludingInactive() {
    return this.service.findAll(false);
  }

  @Get(':role_id')
  findOne(@Param('role_id') role_id: string) {
    return this.service.findOne(role_id);
  }

  @Post()
  create(@Body() dto: CreateRoleDto, @Req() req: any) {
    const user = req.headers['x-user'] || 'system';
    const ip = this.extractIp(req);
    return this.service.create(dto, user, ip);
  }

  @Put(':role_id')
  update(
    @Param('role_id') id: string,
    @Body() dto: UpdateRoleDto,
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
