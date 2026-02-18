import { Module } from '@nestjs/common';
import { RoomManagementController } from './room-management.controller';
import { RoomManagementService } from './room-management.service';
import { DatabaseModule } from '../database/database.module';
import { GuestRoomService } from 'src/guest-room/guest-room.service';

@Module({
  imports: [DatabaseModule],
  controllers: [RoomManagementController],
  providers: [RoomManagementService, GuestRoomService]
})
export class RoomManagementModule {}
