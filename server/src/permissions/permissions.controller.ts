// server/src/permissions/permissions.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly service: PermissionsService) {}

  @Get()
  findAll() {
    return this.service.findAll(true);
  }

  @Get('all')
  findAllIncludingInactive() {
    return this.service.findAll(false);
  }

  @Get(':permission_id')
  findOne(@Param('permission_id') permission_id: string) {
    return this.service.findOne(permission_id);
  }
}
