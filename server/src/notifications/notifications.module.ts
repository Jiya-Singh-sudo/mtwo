import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EmailService } from './channels/emails/emails.service';
import { WhatsAppService } from './channels/whatsapp/whatsapp.service';
import { PushService } from './channels/push/push.service';

@Module({
  providers: [
    NotificationsService,
    EmailService,
    WhatsAppService,
    PushService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
