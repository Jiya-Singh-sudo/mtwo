import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DatabaseService } from 'src/database/database.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationScheduler {

  constructor(
    private readonly db: DatabaseService,
    private readonly notificationsService: NotificationsService
  ) {}

  // Runs every hour
  //@Cron('0 * * * *')
  @Cron('*/30 * * * * *') // every 30 seconds
  async processNotifications()  {
    await this.process48HourReminders();
    await this.process24HourGuestNotifications();
    // await this.processStaffDutyNotifications();
    
  }

    private async process48HourReminders() {

      const guests = await this.db.query(`
        SELECT
          g.guest_id,
          g.guest_name,
          g.guest_mobile,
          io.inout_id,
          io.entry_date,
          io.entry_time
        FROM t_guest_inout io
        JOIN m_guest g ON g.guest_id = io.guest_id
        WHERE
          io.status = 'Scheduled'
          AND io.is_active = TRUE
          AND (io.entry_date::timestamp + io.entry_time) > NOW()
          AND (io.entry_date::timestamp + io.entry_time) <= NOW() + INTERVAL '30 hours'
      `);

      // ✅ Fetch users ONCE (outside loop)
      const users = await this.db.query(`
        SELECT 
          u.user_id,
          s.full_name,
          s.primary_mobile
        FROM m_user u
        JOIN m_staff s ON s.staff_id = u.staff_id
        WHERE u.is_active = TRUE
        AND s.is_active = TRUE
      `);

      for (const guest of guests.rows) {

        const amenities = await this.checkAmenities(guest.guest_id);

        const missing = Object.entries(amenities)
          .filter(([_, v]) => !v)
          .map(([k]) => k);

        // if (missing.length === 0) continue;

        const message = `
    🚨 Guest Arrival Alert

    Guest: ${guest.guest_name}

    Missing Assignments:
    ${missing.map(m => `• ${m}`).join('\n')}
    `;

        // ✅ Loop users INSIDE guest loop
        for (const user of users.rows) {

          if (!user.primary_mobile) continue;

          // await this.notificationsService.createNotification({
          //   guestId: guest.guest_id,
          //   inoutId: guest.inout_id,
          //   notificationType: 'T_MINUS_48_ASSIGNMENT_REMINDER',
          //   recipientType: 'USER',
          //   recipientContact: user.primary_mobile,
          //   channel: 'WHATSAPP',
          //   message
          // });
          // await this.notificationsService.createNotification({
          //   guestId: guest.guest_id,
          //   inoutId: guest.inout_id,
          //   notificationType: 'T_MINUS_48_ASSIGNMENT_REMINDER',
          //   recipientType: 'USER',
          //   recipientContact: user.primary_mobile,
          //   channel: 'SMS',
          //   message
          // });
          // await this.notificationsService.createNotification({
          //   guestId: guest.guest_id,
          //   inoutId: guest.inout_id,
          //   notificationType: 'T_MINUS_48_ASSIGNMENT_REMINDER',
          //   recipientType: 'USER',
          //   recipientContact: user.email,
          //   channel: 'EMAIL',
          //   message
          // });
          console.log("🔥 Scheduler running");
          console.log("Guests found:", guests.rows.length);
        }
      }
    }
    private async checkAmenities(guestId: string) {

        const res = await this.db.query(`
        SELECT
        EXISTS(SELECT 1 FROM t_guest_room WHERE guest_id=$1 AND is_active=TRUE) AS room,
        EXISTS(SELECT 1 FROM t_guest_driver WHERE guest_id=$1 AND is_active=TRUE) AS driver,
        EXISTS(SELECT 1 FROM t_guest_vehicle WHERE guest_id=$1 AND is_active=TRUE) AS vehicle,
        EXISTS(SELECT 1 FROM t_guest_butler WHERE guest_id=$1 AND is_active=TRUE) AS butler,
        EXISTS(SELECT 1 FROM t_guest_messenger WHERE guest_id=$1 AND is_active=TRUE) AS messenger,
        EXISTS(SELECT 1 FROM t_guest_network WHERE guest_id=$1 AND is_active=TRUE) AS network,
        EXISTS(SELECT 1 FROM t_guest_liasoning_officer WHERE guest_id=$1 AND is_active=TRUE) AS liaison,
        EXISTS(SELECT 1 FROM t_guest_medical_contact WHERE guest_id=$1 AND is_active=TRUE) AS medical
    `,[guestId]);

    return res.rows[0];

    }
    private async process24HourGuestNotifications() {

      const guests = await this.db.query(`
        SELECT
          g.guest_id,
          g.guest_name,
          g.guest_mobile,
          g.email,
          io.inout_id,
          io.entry_date,
          io.entry_time
        FROM t_guest_inout io
        JOIN m_guest g ON g.guest_id = io.guest_id
        WHERE
          io.status = 'Scheduled'
          AND io.is_active = TRUE
          AND (io.entry_date::timestamp + io.entry_time) > NOW()
          AND (io.entry_date::timestamp + io.entry_time) <= NOW() + INTERVAL '30 hours'
      `);

      for (const guest of guests.rows) {

        const arrivalTime = new Date(`${guest.entry_date} ${guest.entry_time}`);
        const now = new Date();

        const hoursLeft = (arrivalTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        let shouldSend = false;

        // 24h window
        if (hoursLeft <= 25 && hoursLeft >= 23) {
          shouldSend = true;
        }

        // 6h fallback
        if (hoursLeft <= 7 && hoursLeft >= 5) {
          shouldSend = true;
        }

        if (!shouldSend) continue;

        const amenities = await this.checkAmenities(guest.guest_id);

        let notificationType = 'T_MINUS_24_GUEST_NOTIFICATION';

        if (hoursLeft < 24) {
          notificationType = 'T_MINUS_6_GUEST_NOTIFICATION';
        }

        const templateRow = await this.notificationsService.getTemplate(
          notificationType,
          'WHATSAPP'
        );

        if (!templateRow) continue;

        const message = this.notificationsService.renderTemplate(
          templateRow.template,
          {
            guest_name: guest.guest_name,
            room: amenities.room ? 'Assigned' : 'Not assigned',
            driver: amenities.driver ? 'Yes' : 'No',
            butler: amenities.butler ? 'Assigned' : 'Not assigned',
            messenger: amenities.messenger ? 'Assigned' : 'Not assigned',
            network: amenities.network ? 'Assigned' : 'Not assigned',
            liaison: amenities.liaison ? 'Assigned' : 'Not assigned',
            medical: amenities.medical ? 'Assigned' : 'Not assigned'
          }
        );

        // await this.notificationsService.createNotification({
        //   guestId: guest.guest_id,
        //   inoutId: guest.inout_id,
        //   notificationType,
        //   recipientType: 'GUEST',
        //   recipientContact: guest.guest_mobile,
        //   channel: 'WHATSAPP',
        //   message
        // });
        // await this.notificationsService.createNotification({
        //   guestId: guest.guest_id,
        //   inoutId: guest.inout_id,
        //   notificationType,
        //   recipientType: 'GUEST',
        //   recipientContact: guest.guest_mobile,
        //   channel: 'SMS',
        //   message
        // });
        // await this.notificationsService.createNotification({
        //   guestId: guest.guest_id,
        //   inoutId: guest.inout_id,
        //   notificationType,
        //   recipientType: 'GUEST',
        //   recipientContact: guest.email,
        //   channel: 'EMAIL',
        //   message
        // });
        console.log("🔥 Scheduler running");
        console.log("Guests found:", guests.rows.length);
      }
    }

  }
