import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';

import { MealsService } from './meals.service';
import { CreateMealDto } from './dto/create-meals.dto';
import { UpdateMealDto } from './dto/update-meals.dto';

@Controller('meals')
export class MealsController {
  constructor(private readonly service: MealsService) {}

  private extractIp(req: any): string {
    let ip =
      req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      '';

    if (ip === '::1' || ip === '127.0.0.1') return '127.0.0.1';

    ip = ip.toString().replace('::ffff:', '');
    if (ip.includes(',')) ip = ip.split(',')[0].trim();

    return ip;
  }

  @Get()
  findAllActive() {
    return this.service.findAll(true);
  }

  @Get('all')
  findAllIncludingInactive() {
    return this.service.findAll(false);
  }

  @Post()
  create(@Body() dto: CreateMealDto, @Req() req: any) {
    const user = req.headers['x-user'] || 'system';
    const ip = this.extractIp(req);
    return this.service.create(dto, user, ip);
  }

  @Put(':food_name')
  update(
    @Param('food_name') name: string,
    @Body() dto: UpdateMealDto,
    @Req() req: any,
  ) {
    const user = req.headers['x-user'] || 'system';
    const ip = this.extractIp(req);
    return this.service.update(name, dto, user, ip);
  }

  @Delete(':food_name')
  softDelete(@Param('food_name') name: string, @Req() req: any) {
    const user = req.headers['x-user'] || 'system';
    const ip = this.extractIp(req);
    return this.service.softDelete(name, user, ip);
  }
}
