import { Module } from '@nestjs/common';
import { GuestService } from './guest.service';
import { GuestController } from './guest.controller';
import { PrismaModule } from '../prisma/prisma.module'; 

@Module({
  providers: [GuestService],
  controllers: [GuestController]
})
export class GuestModule {}
