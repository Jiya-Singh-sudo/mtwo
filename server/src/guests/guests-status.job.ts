import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class GuestStatusJob implements OnModuleInit {
  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.autoUpdateGuestStatus();
  }

  @Cron(CronExpression.EVERY_MINUTE) // hourly is too coarse once time is involved
  async autoUpdateGuestStatus() {
    // Use DB time, not Node time (critical for correctness)
    await this.db.query(`
      /* ================= Scheduled → Entered ================= */
      UPDATE t_guest_inout
      SET status = 'Entered',
          updated_at = NOW(),
          updated_by = 'cron',
          updated_ip = '127.0.0.1'
      WHERE status = 'Scheduled'
        AND is_active = TRUE
        AND entry_time IS NOT NULL
        AND entry_date IS NOT NULL
        AND (entry_date::timestamp + entry_time) <= NOW();

      /* ================= Entered / Inside → Exited ================= */
      UPDATE t_guest_inout
      SET status = 'Exited',
          updated_at = NOW(),
          updated_by = 'cron',
          updated_ip = '127.0.0.1'
      WHERE status IN ('Entered', 'Inside')
        AND is_active = TRUE
        AND exit_date IS NOT NULL
        AND exit_time IS NOT NULL
        AND (exit_date::timestamp + exit_time) <= NOW();

      /* ================= Messenger Expiry ================= */
      UPDATE t_guest_messenger
      SET is_active = FALSE,
          updated_at = NOW(),
          updated_by = 'cron',
          updated_ip = '127.0.0.1'
      WHERE is_active = TRUE
        AND assignment_date <= NOW();
    `);
    // console.log('Guest status cron executed at', new Date());
    // await this.db.query(`
    //   /* ================= Scheduled → Entered ================= */
    //   UPDATE t_guest_inout
    //   SET status = 'Entered',
    //       updated_at = NOW()
    //       updated_by = 'cron',
    //       updated_ip = '127.0.0.1'
    //   WHERE status = 'Scheduled'
    //     AND is_active = TRUE
    //     AND (entry_date + entry_time)::timestamp <= NOW();

    //   /* ================= Entered / Inside → Exited ================= */
    //   UPDATE t_guest_inout
    //   SET status = 'Exited',
    //       updated_at = NOW()
    //       updated_by = 'cron',
    //       updated_ip = '127.0.0.1'
    //   WHERE status IN ('Entered', 'Inside')
    //     AND is_active = TRUE
    //     AND exit_date IS NOT NULL
    //     AND exit_time IS NOT NULL
    //     AND (exit_date + exit_time)::timestamp <= NOW();

    //   UPDATE t_guest_messenger
    //   SET is_active = FALSE,
    //       updated_at = NOW()
    //       updated_by = 'cron',
    //       updated_ip = '127.0.0.1'
    //   WHERE is_active = TRUE
    //     AND assignment_date <= NOW();
    // `);
  }
}
