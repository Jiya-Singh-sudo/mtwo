import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Req
} from '@nestjs/common';
import { DesignationService } from './designation.service';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';

@Controller('designations')
export class DesignationController {
  constructor(private readonly service: DesignationService) {}

  private extractIp(req: any): string {
    let ip =
      req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      '';
    ip = ip.replace('::ffff:', '').split(',')[0];
    return ip === '::1' ? '127.0.0.1' : ip;
  }

  @Get()
  getActive() {
    return this.service.findAll(true);
  }

  @Get('all')
  getAll() {
    return this.service.findAll(false);
  }

  @Post()
  create(@Body() dto: CreateDesignationDto, @Req() req: any) {
    const user = req.headers['x-user'] || 'system';
    const ip = this.extractIp(req);
    return this.service.create(dto, user, ip);
  }

  @Put(':designation_name')
  update(
    @Param('designation_name') name: string,
    @Body() dto: UpdateDesignationDto,
    @Req() req: any
  ) {
    const user = req.headers['x-user'] || 'system';
    const ip = this.extractIp(req);
    return this.service.update(name, dto, user, ip);
  }

  @Delete(':designation_name')
  softDelete(@Param('designation_name') name: string, @Req() req: any) {
    const user = req.headers['x-user'] || 'system';
    const ip = this.extractIp(req);
    return this.service.softDelete(name, user, ip);
  }
}
