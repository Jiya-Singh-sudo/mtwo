import { Controller, Get, Post, Put, Delete, Body, Param, Req, Query} from '@nestjs/common';
import { NetworksService } from './networks.service';
import { CreateNetworkDto } from './dto/create-network.dto';
import { UpdateNetworkDto } from './dto/update-network.dto';
import { NetworkTableQueryDto } from './dto/network-table-query.dto';
import { getRequestContext } from 'common/utlis/request-context.util';

@Controller('wifi-providers')
export class NetworksController {
  constructor(private readonly service: NetworksService) {}
  @Get('table')
  getNetworkTable(@Query() query: NetworkTableQueryDto) {
    return this.service.getNetworkTable(query);
  }

  @Get()
  active() {
    return this.service.findAll(true);
  }

  @Get('all')
  all() {
    return this.service.findAll(false);
  }

  @Post()
  create(@Body() dto: CreateNetworkDto, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.create(dto, user, ip);
  }

  @Put(':provider_id')
  update(
    @Param('provider_id') id: string,
    @Body() dto: UpdateNetworkDto,
    @Req() req: any
  ) {
    const { user, ip } = getRequestContext(req);
    return this.service.update(id, dto, user, ip);
  }

  @Delete(':provider_id')
  remove(@Param('provider_id') id: string, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.softDelete(id, user, ip);
  }
}
