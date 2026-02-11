import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
} from '@nestjs/common';
import { MedicalEmergencyServiceService } from './medical-emergency-service.service';
import {
  CreateMedicalEmergencyServiceDto,
  UpdateMedicalEmergencyServiceDto,
} from './dto/medical-emergency-service.dto';

@Controller('medical-emergency-service')
export class MedicalEmergencyServiceController {
  constructor(private readonly service: MedicalEmergencyServiceService) {}

  @Post()
  create(@Body() dto: CreateMedicalEmergencyServiceDto, @Req() req: any) {
    return this.service.create(dto, req.user?.userId, req.ip);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.service.findAllWithFilters({
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
      search: query.search,
      serviceType: query.serviceType,
      isActive:
        query.isActive !== undefined
          ? query.isActive === 'true'
          : undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMedicalEmergencyServiceDto,
    @Req() req: any
  ) {
    return this.service.update(id, dto, req.user?.userId, req.ip);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.service.softDelete(id, req.user?.userId, req.ip);
  }
}
