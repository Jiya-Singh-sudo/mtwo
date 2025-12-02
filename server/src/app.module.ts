import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { GuestModule } from './guest/guest.module';

@Module({
  imports: [PrismaModule, GuestModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
