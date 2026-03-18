import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SmsService {

  private apiKey = process.env.MSG91_API_KEY;

  async sendSMS(phone: string, message: string) {

    await axios.post(
      "https://api.msg91.com/api/v5/flow/",
      {
        mobiles: phone,
        message: message
      },
      {
        headers: {
          authkey: this.apiKey
        }
      }
    );

  }
}