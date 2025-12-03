import { Body, Controller, Get, Post } from '@nestjs/common';
import { GuestService } from './guest.service';

@Controller('guest')
export class GuestController {
  constructor(private service: GuestService) {}

  @Post()
  create(@Body() data) {
    return this.service.create(data);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
