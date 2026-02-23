import { Controller, Get, Patch, Param, Body, Req, Query } from '@nestjs/common';
import { RoomManagementService } from './room-management.service';
import { EditRoomFullDto } from './dto/editFullRoom.dto';
import { getRequestContext } from 'common/utlis/request-context.util';

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
    @Query('status') status?: 'Available' | 'Occupied',
    @Query('entryDateFrom') entryDateFrom?: string,
    @Query('entryDateTo') entryDateTo?: string,
  ) {
    return this.service.getOverview({
      page: Number(page),
      limit: Number(limit),
      search,
      sortBy,
      sortOrder,
      status,
      entryDateFrom,
      entryDateTo,
    });
  }

  @Patch(':room_id/full')
  updateFullRoom(
    @Param('room_id') roomId: string,
    @Body() dto: EditRoomFullDto,
    @Req() req
  ) {
    const { user, ip } = getRequestContext(req);
    return this.service.updateFullRoom(
      roomId,
      dto,
      user,
      ip
    );
  }
  @Get('assignable-guests')
  getAssignableGuests() {
    return this.service.findCheckedInGuestsWithoutRoom();
  }
}
