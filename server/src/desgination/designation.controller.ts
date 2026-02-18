import { Controller, Get, Post, Put, Delete, Body, Param, Req } from '@nestjs/common';
import { DesignationService } from './designation.service';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';
import { getRequestContext } from '../../common/utlis/request-context.util';

@Controller('designations')
export class DesignationController {
  constructor(private readonly service: DesignationService) {}

  @Get()
  getActive() {
    return this.service.findAll(true);
  }

  @Get('all')
  getAll() {
    return this.service.findAll(false);
  }

  @Get("dropdown")
  async getDesignationDropdown() {
    return this.service.getActiveDesignationList();
  }

  @Post()
  create(@Body() dto: CreateDesignationDto, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.create(dto, user, ip);
  }

  @Put(':designation_name')
  update(
    @Param('designation_name') name: string,
    @Body() dto: UpdateDesignationDto,
    @Req() req: any
  ) {
    const { user, ip } = getRequestContext(req);
    return this.service.update(name, dto, user, ip);
  }

  @Delete(':designation_name')
  softDelete(@Param('designation_name') name: string, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.softDelete(name, user, ip);
  }
}
