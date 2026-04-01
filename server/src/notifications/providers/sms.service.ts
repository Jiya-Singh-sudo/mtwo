import { Injectable } from '@nestjs/common';
import twilio from 'twilio';

@Injectable()
export class SmsService {

  private client;

  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  async send(to: string, message: string) {

    let formattedTo = to.trim();

    if (!formattedTo.startsWith('+')) {
      formattedTo = `+91${formattedTo}`;
    }

    return this.client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER, // ⚠️ IMPORTANT
      to: formattedTo,
      body: message
    });
  }
}