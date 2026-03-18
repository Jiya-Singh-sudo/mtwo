import { Controller, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {

  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  async sendNotification(@Body() body: any) {

    const {
      guestId,
      inoutId,
      recipientContact,
      channel,
      message
    } = body;

    return this.notificationsService.createNotification({
      guestId: guestId || null,
      inoutId: inoutId || null,
      notificationType: 'MANUAL_NOTIFICATION',
      recipientType: 'USER',
      recipientContact,
      channel,
      message
    });

  }
}