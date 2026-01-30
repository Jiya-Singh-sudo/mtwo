// guest-status.cron.ts
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GuestsService } from './guests.service';
@Injectable()
export class GuestStatusCron {
  constructor(private readonly guestsService: GuestsService) {}

  // Runs every day at 00:05
  @Cron('5 0 * * *')
  async syncGuestStatuses() {
    await this.guestsService.syncExpiredGuestInOuts(
      'cron',
      '127.0.0.1'
    );
  }
}
