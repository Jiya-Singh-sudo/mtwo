import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req,} from '@nestjs/common';
import { MessengerService } from './messengers.service';
import { CreateMessengerDto } from './dto/create-messenger.dto';
import { UpdateMessengerDto } from './dto/update-messenger.dto';
import { MessengerTableQueryDto } from './dto/messenger-table-query.dto';
import { getRequestContext } from 'common/utlis/request-context.util';

@Controller('messenger')
export class MessengerController {
  constructor(private readonly service: MessengerService) {}
  @Post()
  create(@Body() dto: CreateMessengerDto, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.create(dto, user, ip);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMessengerDto,
    @Req() req: any,
  ) {
    const { user, ip } = getRequestContext(req);
    return this.service.update(
      id,
      dto,
      user,
      ip,
    );
  }

  @Delete(':id')
  softDelete(@Param('id') id: string, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.softDelete(
      id,
      user,
      ip,
    );
  }

  @Get('table')
  getTable(@Query() query: MessengerTableQueryDto) {
    return this.service.getMessengerTable(query);
  }
}
