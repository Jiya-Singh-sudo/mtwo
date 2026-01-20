import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { DatabaseModule } from '../database/database.module'; 
import { ActivityLogModule } from 'src/activity-log/activity-log.module';

@Module({
  imports: [DatabaseModule, ActivityLogModule], 
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
