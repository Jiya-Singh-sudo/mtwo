import { Controller, Get, Post, Put, Delete, Body, Param, Req, Query} from '@nestjs/common';
import { NetworksService } from './networks.service';
import { CreateNetworkDto } from './dto/create-network.dto';
import { UpdateNetworkDto } from './dto/update-network.dto';
import { NetworkTableQueryDto } from './dto/network-table-query.dto';

@Controller('wifi-providers')
export class NetworksController {
  constructor(private readonly service: NetworksService) {}

  private extractIp(req: any): string {
    let ip =
      req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip || '';
    ip = ip.replace('::ffff:', '');
    return ip.includes(',') ? ip.split(',')[0].trim() : ip;
  }
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
    const user = req.headers['x-user'] || 'system';
    return this.service.create(dto, user, this.extractIp(req));
  }

  @Put(':provider_id')
  update(
    @Param('provider_id') id: string,
    @Body() dto: UpdateNetworkDto,
    @Req() req: any
  ) {
    const user = req.headers['x-user'] || 'system';
    return this.service.update(id, dto, user, this.extractIp(req));
  }

  @Delete(':provider_id')
  remove(@Param('provider_id') id: string, @Req() req: any) {
    const user = req.headers['x-user'] || 'system';
    return this.service.softDelete(id, user, this.extractIp(req));
  }
}
