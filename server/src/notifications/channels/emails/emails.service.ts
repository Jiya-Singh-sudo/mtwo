import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      const response = await this.resend.emails.send({
        from: 'MTWO Notifications <no-reply@yourdomain.com>',
        to,
        subject,
        html,
      });

      this.logger.log(`📧 Email sent → ${to}`);
      return response;
    } catch (err: any) {
      this.logger.error(`❌ Email error: ${err.message || err}`);
      throw err; // triggers retry in worker
    }
  }
}
