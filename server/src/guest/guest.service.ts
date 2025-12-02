import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'
import { Prisma } from '@prisma/client';

@Injectable()
export class GuestService {
    constructor(private prisma: PrismaService) {}

  create(data: Prisma.GuestCreateInput) {
    return this.prisma.guest.create({ data })
  }

  findAll() {
    return this.prisma.guest.findMany()
  }
}

