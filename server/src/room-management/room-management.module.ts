import { Module } from '@nestjs/common';
import { RoomManagementController } from './room-management.controller';
import { RoomManagementService } from './room-management.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [RoomManagementController],
  providers: [RoomManagementService]
})
export class RoomManagementModule {}
