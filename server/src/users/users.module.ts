import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DatabaseModule } from 'src/database/database.module';
import { ActivityLogModule } from 'src/activity-log/activity-log.module';

@Module({
  imports: [DatabaseModule, ActivityLogModule],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule {}
