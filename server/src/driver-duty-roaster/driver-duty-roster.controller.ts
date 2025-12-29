import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { DriverDutyRosterService } from './driver-duty-roster.service';
import { CreateDriverDutyDto } from './dto/createDriverDuty.dto';
import { UpdateDriverDutyDto } from './dto/updateDriverDuty.dto';

@Controller('driver-duty')
export class DriverDutyRosterController {
  constructor(private readonly service: DriverDutyRosterService) {}

  /* ================= CREATE ================= */

  @Post()
  create(@Body() dto: CreateDriverDutyDto) {
    return this.service.create(dto);
  }

  /* ================= UPDATE ================= */

  @Put(':dutyId')
  update(
    @Param('dutyId') dutyId: string,
    @Body() dto: UpdateDriverDutyDto,
  ) {
    return this.service.update(dutyId, dto);
  }

  /* ================= READ ================= */

  @Get(':dutyId')
  findOne(@Param('dutyId') dutyId: string) {
    return this.service.findOne(dutyId);
  }

  /**
   * Fetch duties in a date range
   * Example:
   * GET /driver-duty?from=2025-03-01&to=2025-03-07
   */
  @Get()
  findByDateRange(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.service.findByDateRange(from, to);
  }

  /**
   * Fetch duties for a specific driver
   * Example:
   * GET /driver-duty/driver/D001?from=2025-03-01&to=2025-03-31
   */
  @Get('driver/:driverId')
  findByDriver(
    @Param('driverId') driverId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.service.findByDriver(driverId, from, to);
  }
}
