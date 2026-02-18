import { Controller, Get, Post, Put, Delete, Body, Param, Req, Query, Headers, Ip } from '@nestjs/common';
import { ButlersService } from './butlers.service';
import { CreateButlerDto } from './dto/create-butler.dto';
import { UpdateButlerDto } from './dto/update-butler.dto';
import { ButlerTableQueryDto } from './dto/butler-table-query.dto';
import { getRequestContext } from 'common/utlis/request-context.util';

@Controller('butlers')
export class ButlersController {
  constructor(private readonly service: ButlersService) {}

  @Get("table")
  async getButlerTable(
    @Query() query: ButlerTableQueryDto,
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
    const { user, ip } = getRequestContext(req);
    return this.service.create(dto, user, ip);
  }

  @Put(':butler_id')
  update(
    @Param('butler_id') name: string,
    @Body() dto: UpdateButlerDto,
    @Req() req: any
  ) {
    const { user, ip } = getRequestContext(req);
    return this.service.update(name, dto, user, ip);
  }

  @Delete(':butler_id')
  softDelete(@Param('butler_id') name: string, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.softDelete(name, user, ip);
  }
}
