import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {

  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // app password
      },
    });
  }

  async send(to: string, message: string) {

    return this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'Notification',
      text: message,
    });
  }
}