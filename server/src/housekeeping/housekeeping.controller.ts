import { Controller, Get, Post, Put, Delete, Body, Param, Req, Query } from '@nestjs/common';
import { HousekeepingService } from './housekeeping.service';
import { CreateHousekeepingDto } from './dto/create-housekeeping.dto';
import { UpdateHousekeepingDto } from './dto/update-housekeeping.dto';
import { getRequestContext } from 'common/utlis/request-context.util';

@Controller('housekeeping')
export class HousekeepingController {
  constructor(private readonly service: HousekeepingService) {}
  // @Get()
  // getActive() {
  //   return this.service.findAll(true);
  // }

  @Get('all')
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
    @Query('sortBy') sortBy = 'hk_name',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'asc',
  ) {
    return this.service.findAll({
      page: Number(page),
      limit: Number(limit),
      search,
      sortBy,
      sortOrder,
    });
  }


  @Post()
  create(@Body() dto: CreateHousekeepingDto, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.create(dto, user, ip);
  }

  @Put(":hk_name")
  update(@Param("hk_name") name: string, @Body() dto: UpdateHousekeepingDto, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.update(name, dto, user, ip);
  }

  @Delete(":hk_name")
  delete(@Param("hk_name") name: string, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.softDelete(name, user, ip);
  }
}
