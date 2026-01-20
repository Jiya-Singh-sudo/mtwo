import { Global, Module } from '@nestjs/common';
import { ActivityLogController } from './activity-log.controller';
import { ActivityLogService } from './activity-log.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from 'src/auth/auth.module';
@Global()
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ActivityLogController],
  providers: [ActivityLogService],
  exports: [ActivityLogService]
})
export class ActivityLogModule { }
