import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Req, Query
} from '@nestjs/common';
import { HousekeepingService } from './housekeeping.service';
import { CreateHousekeepingDto } from './dto/create-housekeeping.dto';
import { UpdateHousekeepingDto } from './dto/update-housekeeping.dto';

@Controller('housekeeping')
export class HousekeepingController {
  constructor(private readonly service: HousekeepingService) {}

  private extractIp(req: any): string {
    let ip = req.headers['x-forwarded-for']
      || req.connection?.remoteAddress
      || req.socket?.remoteAddress
      || req.ip
      || '';

    return ip.replace("::ffff:", "").split(",")[0];
  }

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
    const user = req.headers["x-user"] || "system";
    return this.service.create(dto, user, this.extractIp(req));
  }

  @Put(":hk_name")
  update(@Param("hk_name") name: string, @Body() dto: UpdateHousekeepingDto, @Req() req: any) {
    const user = req.headers["x-user"] || "system";
    return this.service.update(name, dto, user, this.extractIp(req));
  }

  @Delete(":hk_name")
  delete(@Param("hk_name") name: string, @Req() req: any) {
    const user = req.headers["x-user"] || "system";
    return this.service.softDelete(name, user, this.extractIp(req));
  }
}
