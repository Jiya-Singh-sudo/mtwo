import { Module } from '@nestjs/common';
import { DriverDutyRosterService } from './driver-duty-roster.service';
import { DriverDutyRosterController } from './driver-duty-roster.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [DriverDutyRosterService],
  controllers: [DriverDutyRosterController]
})
export class DriverDutyRosterModule { }
