import { Injectable, Logger } from '@nestjs/common';
import { notificationQueue } from './queue/notification.queue';
import { driverAssignedTemplate } from './templates/driver-assigned.template';
import { guestArrivalTemplate } from './templates/guest-arrival.template';

type Channel = 'email' | 'push' | 'whatsapp';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  private defaultChannels: Channel[] = ['email', 'push'];

  // 👉 DRIVER ASSIGNED
  async notifyDriverAssigned(payload: {
    guestName: string;
    driverName: string;
    vehicle: string;
    pickupTime: string;
    toEmail?: string;
    pushToken?: string;
    toPhone?: string;
    channels?: Channel[];
    meta?: any;   // <── add this line
  }) {
    const template = driverAssignedTemplate(payload);
    const channels = payload.channels ?? this.defaultChannels;

    for (const channel of channels) {
      notificationQueue.push({
        channel,
        payload: {
          toEmail: payload.toEmail,
          pushToken: payload.pushToken,
          toPhone: payload.toPhone,
        },
        template,
        meta: payload.meta,
      });
    }

    this.logger.log(`Driver assigned notification enqueued (${channels.join(', ')})`);
  }

  // 👉 GUEST ARRIVAL
  async notifyGuestArrival(payload: {
    guestName: string;
    arrivalTime: string;
    room?: string;
    toEmail?: string;
    pushToken?: string;
    toPhone?: string;
    channels?: Channel[];
    meta?: any;   // <── add this line
}) {
    const template = guestArrivalTemplate(payload);
    const channels = payload.channels ?? this.defaultChannels;

    for (const channel of channels) {
      notificationQueue.push({
        channel,
        payload: {
          toEmail: payload.toEmail,
          pushToken: payload.pushToken,
          toPhone: payload.toPhone,
        },
        template,
        meta: payload.meta,
      });
    }

    this.logger.log(`Guest arrival notification enqueued (${channels.join(', ')})`);
  }

  // ⭐ You will add more:
  // notifyRoomAssigned()
  // notifyFoodOrderPlaced()
  // notifyHousekeepingTask()
  // notifyScheduleChange()
}
