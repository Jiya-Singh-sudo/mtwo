import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FCM_PROJECT_ID,
          clientEmail: process.env.FCM_CLIENT_EMAIL,
          privateKey: (process.env.FCM_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
      });
    }
  }

  async sendPush(token: string, title: string, body: string) {
    try {
      await admin.messaging().send({
        token,
        notification: { title, body },
      });
      this.logger.log(`Push sent → ${token}`);
    } catch (err: any) {
      this.logger.error(`Push error → ${err.message}`);
      throw err;
    }
  }
}
