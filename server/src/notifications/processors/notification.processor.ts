import { EmailService } from '../channels/emails/emails.service';
import { PushService } from '../channels/push/push.service';

export class NotificationProcessor {
  private email = new EmailService();
  private push = new PushService();

  async handle(job: any) {
    const { channel, payload, template } = job;

    console.log(`🔧 Processing job → channel: ${channel}`);

    if (channel === 'email' && payload.toEmail) {
      await this.email.sendEmail(payload.toEmail, template.title, template.html);
    }

    if (channel === 'push' && payload.pushToken) {
      await this.push.sendPush(payload.pushToken, template.title, template.text);
    }

    // Later: WhatsApp

    return true;
  }
}
