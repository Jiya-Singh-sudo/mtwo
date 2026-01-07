import { Controller, Get, Patch, Param, Body, Req } from '@nestjs/common';
import { RoomManagementService } from './room-management.service';
import { EditRoomFullDto } from './dto/editFullRoom.dto';

@Controller('room-management')
export class RoomManagementController {
  constructor(private readonly service: RoomManagementService) {}

  @Get('overview')
  async getOverview() {
    return this.service.getOverview();
  }
  @Patch(':room_id/full')
  updateFullRoom(
    @Param('room_id') roomId: string,
    @Body() dto: EditRoomFullDto,
    @Req() req
  ) {
    return this.service.updateFullRoom(
      roomId,
      dto,
      req.user?.username ?? 'system',
      req.ip
    );
  }
  @Get('assignable-guests')
  getAssignableGuests() {
    return this.service.findCheckedInGuestsWithoutRoom();
  }
}
