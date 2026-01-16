import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';

import { NetworkMngService } from './network-mng.service';
import type { TableQueryDto } from './dto/table-query.dto';

import type { CreateNetworkDto } from './dto/create-network.dto';
import type { UpdateNetworkDto } from './dto/update-network.dto';

import type { CreateMessengerDto } from './dto/create-messenger.dto';
import type { UpdateMessengerDto } from './dto/update-messenger.dto';

import type { CreateGuestNetworkDto } from './dto/create-guest-network.dto';
import type { UpdateGuestNetworkDto } from './dto/update-guest-network.dto';

import type { CreateGuestMessengerDto } from './dto/create-guest-messgenger.dto';
import type { UpdateGuestMessengerDto } from './dto/update-guest-messenger.dto';

@Controller('guest-connectivity')
export class NetworkMngController {
  constructor(private readonly service: NetworkMngService) { }

  /* ======================================================
     WIFI PROVIDERS (m_wifi_provider)
  ====================================================== */

  @Get('networks/table')
  getNetworkTable(@Query() query: TableQueryDto) {
    return this.service.getNetworkTable(query);
  }

  @Get('networks/:id')
  getNetworkById(@Param('id') id: string) {
    return this.service.getNetworkById(id);
  }

  @Post('networks')
  createNetwork(
    @Body() dto: CreateNetworkDto,
    @Req() req
  ) {
    return this.service.createNetwork(
      dto,
      req.user?.username ?? 'system',
      req.ip ?? ''
    );
  }

  @Put('networks/:id')
  updateNetwork(
    @Param('id') id: string,
    @Body() dto: UpdateNetworkDto,
    @Req() req
  ) {
    return this.service.updateNetwork(
      id,
      dto,
      req.user?.username ?? 'system',
      req.ip ?? ''
    );
  }

  @Delete('networks/:id')
  softDeleteNetwork(
    @Param('id') id: string,
    @Req() req
  ) {
    return this.service.softDeleteNetwork(
      id,
      req.user?.username ?? 'system',
      req.ip ?? ''
    );
  }

  /* ======================================================
     MESSENGERS (m_messenger)
  ====================================================== */

  @Get('messengers/table')
  getMessengerTable(@Query() query: TableQueryDto) {
    return this.service.getMessengerTable(query);
  }

  @Get('messengers/:id')
  getMessengerById(@Param('id') id: string) {
    return this.service.getMessengerById(id);
  }

  @Post('messengers')
  createMessenger(
    @Body() dto: CreateMessengerDto,
    @Req() req
  ) {
    return this.service.createMessenger(
      dto,
      req.user?.username ?? 'system',
      req.ip ?? ''
    );
  }

  @Put('messengers/:id')
  updateMessenger(
    @Param('id') id: string,
    @Body() dto: UpdateMessengerDto,
    @Req() req
  ) {
    return this.service.updateMessenger(
      id,
      dto,
      req.user?.username ?? 'system',
      req.ip ?? ''
    );
  }

  @Delete('messengers/:id')
  softDeleteMessenger(
    @Param('id') id: string,
    @Req() req
  ) {
    return this.service.softDeleteMessenger(
      id,
      req.user?.username ?? 'system',
      req.ip ?? ''
    );
  }

  /* ======================================================
     GUEST ↔ NETWORK (t_guest_network)
  ====================================================== */

  @Get('guest-networks/table')
  getGuestNetworkTable(@Query() query: TableQueryDto) {
    return this.service.getGuestNetworkTable(query);
  }

  @Get('guest-networks/:id')
  getGuestNetworkById(@Param('id') id: string) {
    return this.service.getGuestNetworkById(id);
  }

  @Post('guest-networks')
  createGuestNetwork(
    @Body() dto: CreateGuestNetworkDto,
    @Req() req
  ) {
    return this.service.createGuestNetwork(
      dto,
      req.user?.username ?? 'system',
      req.ip ?? ''
    );
  }

  @Put('guest-networks/:id')
  updateGuestNetwork(
    @Param('id') id: string,
    @Body() dto: UpdateGuestNetworkDto,
    @Req() req
  ) {
    return this.service.updateGuestNetwork(
      id,
      dto,
      req.user?.username ?? 'system',
      req.ip ?? ''
    );
  }

  @Delete('guest-networks/:id')
  softDeleteGuestNetwork(
    @Param('id') id: string,
    @Req() req
  ) {
    return this.service.softDeleteGuestNetwork(
      id,
      req.user?.username ?? 'system',
      req.ip ?? ''
    );
  }

  /* ======================================================
     GUEST ↔ MESSENGER (t_guest_messenger)
  ====================================================== */

  @Get('guest-messengers/table')
  getGuestMessengerTable(@Query() query: TableQueryDto) {
    return this.service.getGuestMessengerTable(query);
  }

  @Get('guest-messengers/:id')
  getGuestMessengerById(@Param('id') id: string) {
    return this.service.getGuestMessengerById(id);
  }

  @Post('guest-messengers')
  createGuestMessenger(
    @Body() dto: CreateGuestMessengerDto,
    @Req() req
  ) {
    return this.service.createGuestMessenger(
      dto,
      req.user?.username ?? 'system',
      req.ip ?? ''
    );
  }

  @Put('guest-messengers/:id')
  updateGuestMessenger(
    @Param('id') id: string,
    @Body() dto: UpdateGuestMessengerDto,
    @Req() req
  ) {
    return this.service.updateGuestMessenger(
      id,
      dto,
      req.user?.username ?? 'system',
      req.ip ?? ''
    );
  }

  @Delete('guest-messengers/:id')
  softDeleteGuestMessenger(
    @Param('id') id: string,
    @Req() req
  ) {
    return this.service.softDeleteGuestMessenger(
      id,
      req.user?.username ?? 'system',
      req.ip ?? ''
    );
  }
}
