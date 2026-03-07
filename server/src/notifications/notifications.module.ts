import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { DatabaseModule } from 'src/database/database.module';
import { NotificationScheduler } from './notification.scheduler';
import { NotificationWorker } from './notification.worker';

@Module({
  imports: [DatabaseModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationScheduler, NotificationWorker]
})
export class NotificationsModule {}
