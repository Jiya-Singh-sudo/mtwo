import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';
import { GuestsService } from './guests.service';

@Injectable()
export class GuestStatusJob implements OnModuleInit {
  constructor(private readonly db: DatabaseService,
    private readonly guestService: GuestsService,
  ) {}

  async onModuleInit() {
    await this.autoUpdateGuestStatusIn();
    await this.autoUpdateGuestStatusOut();
  }

  @Cron(CronExpression.EVERY_MINUTE) // hourly is too coarse once time is involved
  async autoUpdateGuestStatusIn() {
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
  async autoUpdateGuestStatusOut() {
    // Use DB time, not Node time (critical for correctness)
    await this.db.query(`
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
    await this.guestService.syncExpiredGuestInOuts(
      "System",
      "0.0.0.0",
    );
    const expired = await this.db.query(`
      SELECT inout_id, guest_id
      FROM t_guest_inout
      WHERE
        is_active = TRUE
        AND guest_inout = TRUE
        AND status = 'Entered'
        AND exit_date < NOW()
    `);
    for (const row of expired.rows) {
      await this.guestService.cascadeGuestExit(
        row.inout_id,
        row.guest_id,
        "System",
        "0.0.0.0",
      );
    }
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
