import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WhatsAppService {

  private apiUrl = `https://graph.facebook.com/v19.0/YOUR_PHONE_NUMBER_ID/messages`;

  private token = process.env.WHATSAPP_TOKEN;

  async sendMessage(phone: string, message: string) {

    await axios.post(
      this.apiUrl,
      {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: {
          body: message
        }
      },
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json"
        }
      }
    );

  }
}