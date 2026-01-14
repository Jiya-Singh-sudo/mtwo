import { Get, Query, Controller } from '@nestjs/common';
import { GuestTransportService } from './guest-transport.service';
import { GuestTransportTableQueryDto } from './dto/guest-transport-table.dto';

@Controller('guest-transport')
export class GuestTransportController {
    constructor(private readonly service: GuestTransportService) {}

    @Get('table')
    async getGuestTransportTable(
    @Query() query: GuestTransportTableQueryDto
    ) {
    return this.service.getGuestTransportTable({
        page: Number(query.page) || 1,
        limit: Number(query.limit) || 10,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
    });
    }

}
