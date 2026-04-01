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

    if (!formattedTo.startsWith('+')) {
      formattedTo = `+91${formattedTo}`;
    }

    console.log("📤 Final number:", formattedTo); // ADD THIS

    const res = await this.client.messages.create({
      from: 'whatsapp:+14155238886',
      to: `whatsapp:${formattedTo}`,
      body: message
    });

    console.log("📨 Twilio SID:", res.sid); // ADD THIS

    return res;
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