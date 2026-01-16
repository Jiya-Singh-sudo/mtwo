import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req,} from '@nestjs/common';
import { MessengerService } from './messengers.service';
import { CreateMessengerDto } from './dto/create-messenger.dto';
import { UpdateMessengerDto } from './dto/update-messenger.dto';
import { MessengerTableQueryDto } from './dto/messenger-table-query.dto';

@Controller('messenger')
export class MessengerController {
  constructor(private readonly service: MessengerService) {}

  private extractIp(req: any): string {
    let ip =
      req.headers['x-forwarded-for'] ||
      req.socket?.remoteAddress ||
      req.ip ||
      '';
    return ip.replace('::ffff:', '').split(',')[0];
  }

  @Post()
  create(@Body() dto: CreateMessengerDto, @Req() req: any) {
    return this.service.create(
      dto,
      req.headers['x-user'] || 'system',
      this.extractIp(req),
    );
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMessengerDto,
    @Req() req: any,
  ) {
    return this.service.update(
      id,
      dto,
      req.headers['x-user'] || 'system',
      this.extractIp(req),
    );
  }

  @Delete(':id')
  softDelete(@Param('id') id: string, @Req() req: any) {
    return this.service.softDelete(
      id,
      req.headers['x-user'] || 'system',
      this.extractIp(req),
    );
  }

  @Get('table')
  getTable(@Query() query: MessengerTableQueryDto) {
    return this.service.getMessengerTable(query);
  }
}
