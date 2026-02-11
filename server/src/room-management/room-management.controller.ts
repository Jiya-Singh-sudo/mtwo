import { Controller, Get, Patch, Param, Body, Req, Query } from '@nestjs/common';
import { RoomManagementService } from './room-management.service';
import { EditRoomFullDto } from './dto/editFullRoom.dto';

@Controller('room-management')
export class RoomManagementController {
  constructor(private readonly service: RoomManagementService) {}

  @Get('overview')
  getOverview(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
    @Query('sortBy') sortBy = 'room_no',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'asc',
    @Query('status') status?: 'Available' | 'Occupied'
  ) {
    return this.service.getOverview({
      page: Number(page),
      limit: Number(limit),
      search,
      sortBy,
      sortOrder,
      status,
    });
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
