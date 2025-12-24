import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { DriverDutyRoasterService } from './driver-duty-roaster.service';
import { CreateDriverDutyDto } from './dto/createDriverDuty.dto';
import { UpdateDriverDutyDto } from './dto/updateDriverDuty.dto';

@Controller('driver-duty-roaster')
export class DriverDutyRoasterController {
  constructor(private readonly service: DriverDutyRoasterService) {}

    @Get('driver-duties')
  findDriversWithRoaster() {
    return this.service.findDriversWithRoaster();
  }
  @Get('ping')
  ping() {
    return 'driver duty roaster alive';
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDriverDutyDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDriverDutyDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
