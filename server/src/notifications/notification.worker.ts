import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DatabaseService } from 'src/database/database.service';
import { NotificationsService } from './notifications.service';
import { WhatsAppService } from './providers/whatsapp.service';
import { SmsService } from './providers/sms.service';
import { EmailService } from './providers/email.service';
interface NotificationRow {
  notification_id: string;
  recipient_contact: string;
  message: string;
  channel: 'WHATSAPP' | 'SMS' | 'EMAIL';
}
@Injectable()
export class NotificationWorker {

  constructor(
    private readonly db: DatabaseService,
    private readonly notificationsService: NotificationsService,
    private whatsappService: WhatsAppService,
    private smsService: SmsService,
    private emailService: EmailService
  ) {}

  // runs every 30 seconds
  @Cron('*/30 * * * * *')
  async processQueue() {

    const pending = await this.db.query(`
    UPDATE notifications
    SET status = 'PROCESSING'
    WHERE notification_id IN (
        SELECT notification_id
        FROM notifications
        WHERE status = 'PENDING'
        ORDER BY inserted_at
        LIMIT 20
        FOR UPDATE SKIP LOCKED
    )
    RETURNING *;
    `);

    for (const notification of pending.rows as NotificationRow[]) {
      try {

        await this.dispatchNotification(notification);

        await this.notificationsService.markNotificationSent(
          notification.notification_id
        );

      } catch (err) {

        await this.notificationsService.markNotificationFailed(
          notification.notification_id,
          err?.message || 'Unknown error'
        );

      }
    console.log(`Processing notification ${notification.notification_id}`);
    }

  }
private async dispatchNotification(notification: NotificationRow) {

  switch (notification.channel) {

    case 'WHATSAPP':
      await this.sendWhatsApp(notification);
      break;

    case 'SMS':
      await this.sendSMS(notification);
      break;

    case 'EMAIL':
      await this.sendEmail(notification);
      break;

    default:
      throw new Error(`Unsupported channel ${notification.channel}`);
  }

}
private async sendWhatsApp(notification: NotificationRow) {

  console.log(`
  WHATSAPP MESSAGE
  To: ${notification.recipient_contact}
  Message: ${notification.message}
  `);

}

private async sendSMS(notification: NotificationRow) {

  console.log(`
  SMS MESSAGE
  To: ${notification.recipient_contact}
  Message: ${notification.message}
  `);

}

private async sendEmail(notification: NotificationRow) {

  console.log(`
  EMAIL MESSAGE
  To: ${notification.recipient_contact}
  Message: ${notification.message}
  `);

}
}
