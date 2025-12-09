import { Module } from '@nestjs/common';
import { GuestHousekeepingController } from './guest-housekeeping.controller';
import { GuestHousekeepingService } from './guest-housekeeping.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [GuestHousekeepingController],
  providers: [GuestHousekeepingService]
})
export class GuestHousekeepingModule {}
