import { Controller, Get, Post, Put, Delete, Body, Param, Req, Query, Headers, Ip } from '@nestjs/common';
import { ButlersService } from './butlers.service';
import { CreateButlerDto } from './dto/create-butler.dto';
import { UpdateButlerDto } from './dto/update-butler.dto';
import { ButlerTableQueryDto } from './dto/butler-table-query.dto';

@Controller('butlers')
export class ButlersController {
  constructor(private readonly service: ButlersService) {}

  private extractIp(req: any): string {
    let ip =
      req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip || '';

    if (ip === '::1' || ip === '127.0.0.1') return '127.0.0.1';
    ip = ip.replace('::ffff:', '');
    return ip.includes(',') ? ip.split(',')[0].trim() : ip;
  }

  @Get("table")
  async getButlerTable(
    @Query() query: ButlerTableQueryDto,
    @Headers("x-user") user = "system",
    @Ip() ip: string
  ) {
    return this.service.getTable(query);
  }

  @Get()
  findAllActive() {
    return this.service.findAll(true);
  }

  @Get('all')
  findAll() {
    return this.service.findAll(false);
  }

  @Post()
  create(@Body() dto: CreateButlerDto, @Req() req: any) {
    const user = req.headers['x-user'] || 'system';
    return this.service.create(dto, user, this.extractIp(req));
  }

  @Put(':butler_id')
  update(
    @Param('butler_id') name: string,
    @Body() dto: UpdateButlerDto,
    @Req() req: any
  ) {
    const user = req.headers['x-user'] || 'system';
    return this.service.update(name, dto, user, this.extractIp(req));
  }

  @Delete(':butler_id')
  softDelete(@Param('butler_id') name: string, @Req() req: any) {
    const user = req.headers['x-user'] || 'system';
    return this.service.softDelete(name, user, this.extractIp(req));
  }
}
