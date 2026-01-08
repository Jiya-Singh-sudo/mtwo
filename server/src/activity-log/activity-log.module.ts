import { Module } from '@nestjs/common';
import { ActivityLogController } from './activity-log.controller';
import { ActivityLogService } from './activity-log.service';
import { DatabaseService } from '../database/database.service';

@Module({
  imports: [DatabaseService],
  controllers: [ActivityLogController],
  providers: [ActivityLogService]
})
export class ActivityLogModule {}
