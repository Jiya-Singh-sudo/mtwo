import { Injectable } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {

    constructor() {
        sgMail.setApiKey(process.env.SENDGRID_KEY as string);
    }

    async sendEmail(to: string, message: string) {

        await sgMail.send({
            to,
            from: 'noreply@yourdomain.com',
            subject: 'Notification',
            text: message
        });

    }
}