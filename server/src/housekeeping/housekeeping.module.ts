import { Module } from '@nestjs/common';
import { HousekeepingController } from './housekeeping.controller';
import { HousekeepingService } from './housekeeping.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [HousekeepingController],
  providers: [HousekeepingService]
})
export class HousekeepingModule {}
