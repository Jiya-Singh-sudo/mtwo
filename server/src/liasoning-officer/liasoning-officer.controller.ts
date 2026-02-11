// server/src/modules/liasoning-officer/liasoning-officer.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
  Query
} from '@nestjs/common';
import { LiasoningOfficerService } from './liasoning-officer.service';
import { CreateLiasoningOfficerDto, UpdateLiasoningOfficerDto } from './dto/liasoning-officer.dto';

@Controller('liasoning-officer')
export class LiasoningOfficerController {
  constructor(private readonly service: LiasoningOfficerService) {}

  @Post()
  create(@Body() dto: CreateLiasoningOfficerDto, @Req() req: any) {
    return this.service.create(dto, req.user.userId, req.ip);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLiasoningOfficerDto,
    @Req() req: any
  ) {
    return this.service.update(id, dto, req.user.userId, req.ip);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.service.softDelete(id, req.user.userId, req.ip);
  }
    @Get()
    findAll(@Query() query: any) {
    return this.service.findAllWithFilters({
        page: Number(query.page) || 1,
        limit: Number(query.limit) || 10,
        search: query.search,
        isActive:
        query.isActive !== undefined
            ? query.isActive === 'true'
            : undefined,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
    });
    }

}
