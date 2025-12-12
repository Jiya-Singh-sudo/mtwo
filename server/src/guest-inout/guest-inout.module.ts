import { Module } from '@nestjs/common';
import { GuestInoutController } from './guest-inout.controller';
import { GuestInoutService } from './guest-inout.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [GuestInoutController],
  providers: [GuestInoutService],
  exports: [GuestInoutService]
})
export class GuestInoutModule {}
