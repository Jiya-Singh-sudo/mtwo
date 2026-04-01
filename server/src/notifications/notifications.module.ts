import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationWorker } from './notification.worker';
import { NotificationScheduler } from './notification.scheduler';
import { WhatsAppService } from './providers/whatsapp.service';
import { SmsService } from './providers/sms.service';
import { EmailService } from './providers/email.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationScheduler,
    NotificationWorker,
    WhatsAppService,
    SmsService,
    EmailService
  ]
})
export class NotificationsModule {}