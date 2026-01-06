import { Controller, Get } from '@nestjs/common';
import { RoomManagementService } from './room-management.service';

@Controller('room-management')
export class RoomManagementController {
  constructor(private readonly service: RoomManagementService) {}

  @Get('overview')
  async getOverview() {
    return this.service.getOverview();
  }
}
