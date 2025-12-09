import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  // Your WhatsApp Cloud API token
  private readonly token = process.env.WHATSAPP_TOKEN;

  // Your WhatsApp sender phone ID from Meta dashboard
  private readonly phoneId = process.env.WHATSAPP_PHONE_ID;

  private readonly apiUrl = `https://graph.facebook.com/v18.0`;

  async sendWhatsApp(to: string, message: string) {
    try {
      const url = `${this.apiUrl}/${this.phoneId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      };

      const headers = {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      };

      const response = await axios.post(url, payload, { headers });

      this.logger.log(`WhatsApp message sent → ${to}`);
      return response.data;
    } catch (error) {
      this.logger.error(`WhatsApp send error → ${error.message}`);
      return null;
    }
  }
}
