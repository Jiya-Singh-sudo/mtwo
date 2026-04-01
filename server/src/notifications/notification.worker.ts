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
  // @Cron('*/30 * * * * *')
  @Cron('*/30 * * * * *')
  async processQueue() {
    console.log("⚙️ Worker running..."); // ✅ ADD HERE
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
console.log("📦 Pending notifications:", pending.rows.length); // ✅ ADD THIS
    for (const notification of pending.rows as NotificationRow[]) {
      try {
  console.log("🚀 Sending notification:", notification.notification_id);
        await this.dispatchNotification(notification);

        await this.notificationsService.markNotificationSent(
          notification.notification_id
        );

      } catch (err) {

          console.error("❌ WHATSAPP ERROR:", err?.response?.data || err);

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

  console.log("📲 Sending WhatsApp to:", notification.recipient_contact);

  const res = await this.whatsappService.send(
    notification.recipient_contact,
    notification.message
  );

  console.log("✅ Twilio response:", res.sid); // VERY IMPORTANT
}

private async sendSMS(notification: NotificationRow) {
  await this.smsService.send(
    notification.recipient_contact,
    notification.message
  );
}

private async sendEmail(notification: NotificationRow) {
  await this.emailService.send(
    notification.recipient_contact,
    notification.message
  );
}
}
