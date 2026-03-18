import { Injectable } from '@nestjs/common';
import twilio from 'twilio';

@Injectable()
export class WhatsAppService {

  private client;

  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  async send(to: string, message: string) {

    let formattedTo = to.trim();

    // ensure + prefix
    if (!formattedTo.startsWith('+')) {
      formattedTo = `+${formattedTo}`;
    }

    return this.client.messages.create({
      from: 'whatsapp:+14155238886',
      to: `whatsapp:${formattedTo}`,
      body: message
    });
  }
  // async send(to: string, message: string) {

  //   const formattedTo = to.startsWith('+') ? to : `+${to}`;

  //   return this.client.messages.create({
  //     from: 'whatsapp:+14155238886',
  //     to: `whatsapp:${formattedTo}`,
  //     body: message
  //   });

  // }
}