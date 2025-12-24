import { Module } from '@nestjs/common';
import { DriverDutyRoasterService } from './driver-duty-roaster.service';
import { DriverDutyRoasterController } from './driver-duty-roaster.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [DriverDutyRoasterService],
  controllers: [DriverDutyRoasterController]
})
export class DriverDutyRoasterModule {}
