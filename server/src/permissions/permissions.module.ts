import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { DatabaseModule } from 'src/database/database.module';
import { PermissionsGuard } from 'src/gaurds/permissions/permissions.guard';
@Module({
  imports: [DatabaseModule],
  providers: [PermissionsService, PermissionsGuard],
  controllers: [PermissionsController],
  exports: [PermissionsGuard]
})
export class PermissionsModule {}
