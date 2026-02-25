import { Controller, Get, Post, Put, Body, Param, Delete, Req, Patch, Query } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/createDriver.dto';
import { UpdateDriverDto } from './dto/updateDriver.dto';
import { BadRequestException } from '@nestjs/common';
import { getRequestContext } from 'common/utlis/request-context.util';

@Controller('drivers')
export class DriversController {
  constructor(private readonly service: DriversService) {}
  @Get('stats')
  getDriverStats() {
    return this.service.getDriverStats();
  }
  @Get('table')
  getDriversTable(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @Query('status') status?: 'all' | 'active' | 'inactive',
    @Query('sortBy') sortBy = 'driver_name',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'asc',
  ) {
    return this.service.getDriversTable({
      page: Number(page),
      limit: Number(limit),
      search,
      status, 
      sortBy,
      sortOrder,
    });
  }

  @Get('dashboard')
  getDashboard() {
    return this.service.getDriverDashboard();
  }

  @Post()
  create(@Body() dto: CreateDriverDto, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.create(dto, user, ip);
  }
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDriverDto,
    @Req() req: any
  ) {
    const { user, ip } = getRequestContext(req);
    return this.service.update(id, dto, user, ip);
  }

  @Post('assign')
  assignDriver(
    @Body() body: { guest_vehicle_id: string; driver_id: string },
    @Req() req: any
  ) {
    const { user, ip } = getRequestContext(req);
    return this.service.assignDriver(body, user, ip);
  }

  @Get('assignable-by-date')
  getAssignableDriversByDate(
    @Query('date') date: string
  ) {
    if (!date) {
      throw new BadRequestException('date is required');
    }

    return this.service.findDriversOnDutyByDate(date);
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
  @Delete(':driver_id')
  softDelete(@Param('driver_id') driver_id: string, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.softDelete(driver_id, user, ip);
  }
}
