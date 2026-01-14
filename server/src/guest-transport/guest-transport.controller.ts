import { Get, Query, Controller } from '@nestjs/common';
import { GuestTransportService } from './guest-transport.service';
import { GuestTransportTableQueryDto } from './dto/guest-transport-table.dto';

@Controller('guest-transport')
export class GuestTransportController {
    constructor(private readonly service: GuestTransportService) {}

    @Get('table')
    getTable(
    @Query() query: GuestTransportTableQueryDto,
    ) {
    return this.service.getGuestTransportTable({
        ...query,
        status: query.status === 'All' ? undefined : query.status,
    });
    }
}
