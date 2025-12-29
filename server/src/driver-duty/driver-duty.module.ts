import { Module } from '@nestjs/common';
import { DriverDutyService } from './driver-duty.service';
import { DriverDutyController } from './driver-duty.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [DriverDutyService],
  controllers: [DriverDutyController]
})
export class DriverDutyModule {}
