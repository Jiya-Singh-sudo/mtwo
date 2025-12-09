import { Module } from '@nestjs/common';
import { GuestRoomController } from './guest-room.controller';
import { GuestRoomService } from './guest-room.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [GuestRoomController],
  providers: [GuestRoomService]
})
export class GuestRoomModule {}
