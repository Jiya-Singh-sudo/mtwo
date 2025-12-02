import { Body, Controller, Get, Post } from '@nestjs/common'
import { GuestService } from './guest.service'
import { Prisma } from '@prisma/client'

@Controller('guest')
export class GuestController {
  constructor(private guestService: GuestService) {}

  @Post()
  create(@Body() data: Prisma.GuestCreateInput) {
    return this.guestService.create(data)
  }

  @Get()
  findAll() {
    return this.guestService.findAll()
  }
}
