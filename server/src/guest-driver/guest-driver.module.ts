import { Module } from '@nestjs/common';
import { GuestDriverController } from './guest-driver.controller';
import { GuestDriverService } from './guest-driver.service';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [GuestDriverController],
  providers: [GuestDriverService]
})
export class GuestDriverModule { }
