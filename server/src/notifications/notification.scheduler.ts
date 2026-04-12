import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DatabaseService } from 'src/database/database.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationScheduler {

  constructor(
    private readonly db: DatabaseService,
    private readonly notificationsService: NotificationsService
  ) { }

  // Runs every hour
  //@Cron('0 * * * *')
  @Cron('*/30 * * * * *') // every 30 seconds
  async processNotifications() {
    await this.guestArrivalReminders();
    await this.process24HourGuestNotifications();
    await this.guestStayDetailsNotification();
    await this.GarageNotification();
    await this.guestPickupNotification();
    await this.staffDutyNotification();
    await this.driverPickupNotification();
    // await this.processStaffDutyNotifications();
    
  }
private async getUpcomingGuests(hours: number) {
  return this.db.query(`
    SELECT
      g.guest_id,
      g.guest_name,
      g.guest_mobile,
      g.email,
      io.inout_id,
      io.entry_date,
      io.entry_time,
      io.requires_driver
    FROM t_guest_inout io
    JOIN m_guest g ON g.guest_id = io.guest_id
    WHERE
      io.status = 'Scheduled'
      AND io.is_active = TRUE
      AND (io.entry_date::timestamp + io.entry_time) > NOW()
      AND (io.entry_date::timestamp + io.entry_time) <= NOW() + INTERVAL '${hours} hours'
  `);
}
private getMissingAssignments(amenities: any, requiresVehicle: boolean) {
  const missing: string[] = [];

  if (!amenities.room) missing.push('Room');
  if (!amenities.butler) missing.push('Butler');
  if (!amenities.messenger) missing.push('Room Boy');

  if (requiresVehicle) {
    if (!amenities.vehicle) missing.push('Vehicle');
    if (!amenities.driver) missing.push('Driver');
  }

  if (!amenities.liaison) missing.push('Liaisoning Officer');
  if (!amenities.network) missing.push('Network');

  return missing;
}
private shouldSend24HourNotification(hoursLeft: number): boolean {
  return (
    (hoursLeft <= 25 && hoursLeft >= 23) ||
    (hoursLeft <= 7 && hoursLeft >= 5)
  );
}

private buildMissingAssignmentMessage(
  guestName: string,
  missing: string[]
): string {
  return `
Guest Arriving in 24 Hours

Guest: ${guestName}

The following are NOT assigned:
${missing.map(m => `• ${m}`).join('\n')}

Please assign immediately.
  `;
}
private async getActiveUsers() {
  return this.db.query(`
    SELECT 
      u.user_id,
      s.full_name,
      s.primary_mobile
    FROM m_user u
    JOIN m_staff s ON s.staff_id = u.staff_id
    WHERE 
      u.is_active = TRUE
      AND s.is_active = TRUE
  `);
}
private async notifyUsers(message: string, guest: any) {
  const users = await this.getActiveUsers();

  for (const user of users.rows) {
    if (!user.primary_mobile) continue;

    await this.notificationsService.createNotification({
      guestId: guest.guest_id,
      inoutId: guest.inout_id,
      notificationType: 'T_MINUS_24_ASSIGNMENT_ALERT',
      recipientType: 'USER',
      recipientContact: user.primary_mobile,
      channel: 'WHATSAPP',
      message
    });
  }
}
    private async guestArrivalReminders() {
      const guests = await this.getUpcomingGuests(24);
      // const guests = await this.db.query(`
      //   SELECT
      //     g.guest_id,
      //     g.guest_name,
      //     g.guest_mobile,
      //     io.inout_id,
      //     io.entry_date,
      //     io.entry_time
      //   FROM t_guest_inout io
      //   JOIN m_guest g ON g.guest_id = io.guest_id
      //   WHERE
      //     io.status = 'Scheduled'
      //     AND io.is_active = TRUE
      //     AND (io.entry_date::timestamp + io.entry_time) > NOW()
      //     AND (io.entry_date::timestamp + io.entry_time) <= NOW() + INTERVAL '30 hours'
      // `);

      // ✅ Fetch users ONCE (outside loop)
      // const users = await this.db.query(`
      //   SELECT 
      //     u.user_id,
      //     s.full_name,
      //     s.primary_mobile
      //   FROM m_user u
      //   JOIN m_staff s ON s.staff_id = u.staff_id
      //   WHERE u.is_active = TRUE
      //   AND s.is_active = TRUE
      // `);
      const users = await this.getActiveUsers();
      for (const guest of guests.rows) {

        const amenities = await this.checkAmenities(guest.guest_id);

        const missing = this.getMissingAssignments(amenities,true);

        if (missing.length === 0) continue;

        const message = this.buildMissingAssignmentMessage(guest.guest_name, missing);

        // ✅ Loop users INSIDE guest loop
        for (const user of users.rows) {

          if (!user.primary_mobile) continue;
          // await this.notifyUsers(message, guest);

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
private buildGuestDetailsMessage(guestName: string, d: any): string {
  return `
Your Stay Details at Lok Bhavan, Maharashtra 

Guest: ${guestName}

🏨 Room
Room No: ${d.room_number || 'Not assigned'}
Room Name: ${d.room_name || '-'}

🧑‍💼 Butler
Name: ${d.butler_name || 'Not assigned'}
Contact: ${d.butler_contact || '-'}

🧹 Room Boy
Name: ${d.room_boy_name || 'Not assigned'}
Contact: ${d.room_boy_contact || '-'}

🤝 Liaison Officer
Name: ${d.liaison_name || 'Not assigned'}
Contact: ${d.liaison_contact || '-'}

🏥 Medical Officer
Name: ${d.medical_name || 'Not assigned'}
Contact: ${d.medical_contact || '-'}

🌐 Network Access
Username: ${d.network_username || '-'}
Password: ${d.network_password || '-'}

🚗 Vehicle: ${d.vehicle_assigned ? 'Yes' : 'No'}
👨‍✈️ Driver: ${d.driver_assigned ? 'Yes' : 'No'}

We look forward to your arrival!
  `;
}
private async getFullGuestDetails(guestId: string) {
  const res = await this.db.query(`
    SELECT
      r.room_no,
      r.building_name,

      bs.full_name AS butler_name,
      bs.primary_mobile AS butler_contact,

      hs.full_name AS room_boy_name,
      hs.primary_mobile AS room_boy_contact,

      los.full_name AS liaison_name,
      los.primary_mobile AS liaison_contact,

      mos.full_name AS medical_name,
      mos.primary_mobile AS medical_contact,

      n.username AS network_username,
      n.password AS network_password,

      EXISTS(
        SELECT 1 FROM t_guest_vehicle 
        WHERE guest_id = $1 AND is_active = TRUE
      ) AS vehicle_assigned,

      EXISTS(
        SELECT 1 FROM t_guest_driver 
        WHERE guest_id = $1 AND is_active = TRUE
      ) AS driver_assigned

    FROM m_guest g

    LEFT JOIN t_guest_room gr ON g.guest_id = gr.guest_id
    LEFT JOIN m_rooms r ON gr.room_id = r.room_id

    -- Butler
    LEFT JOIN t_guest_butler gb ON g.guest_id = gb.guest_id
    LEFT JOIN m_butler b ON gb.butler_id = b.butler_id
    LEFT JOIN m_staff bs ON b.staff_id = bs.staff_id

    -- Room Boy (Housekeeping)
    LEFT JOIN t_guest_hk grb ON g.guest_id = grb.guest_id
    LEFT JOIN m_housekeeping h ON grb.hk_id = h.hk_id
    LEFT JOIN m_staff hs ON h.staff_id = hs.staff_id

    -- Liaison
    LEFT JOIN t_guest_liasoning_officer glo ON g.guest_id = glo.guest_id
    LEFT JOIN m_liasoning_officer lo ON glo.officer_id = lo.officer_id
    LEFT JOIN m_staff los ON lo.staff_id = los.staff_id

    -- Medical
    LEFT JOIN t_guest_medical_contact gmo ON g.guest_id = gmo.guest_id
    LEFT JOIN m_medical_emergency_service mo ON gmo.service_id = mo.service_id
    LEFT JOIN m_staff mos ON mo.staff_id = mos.staff_id

    -- Network
    LEFT JOIN t_guest_network gn ON g.guest_id = gn.guest_id
    LEFT JOIN m_wifi_provider n ON gn.provider_id = n.provider_id

    WHERE g.guest_id = $1
  `, [guestId]);

  return res.rows[0];
}
private async guestStayDetailsNotification() {
  const guests = await this.getUpcomingGuests(12);

  for (const guest of guests.rows) {

    const arrivalTime = new Date(`${guest.entry_date} ${guest.entry_time}`);
    const now = new Date();

    const hoursLeft =
      (arrivalTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // 🎯 Only trigger around 12h window
    if (!(hoursLeft <= 13 && hoursLeft >= 11)) continue;

    const details = await this.getFullGuestDetails(guest.guest_id);

    const message = this.buildGuestDetailsMessage(
      guest.guest_name,
      details
    );

    await this.notificationsService.createNotification({
      guestId: guest.guest_id,
      inoutId: guest.inout_id,
      notificationType: 'T_MINUS_12_FULL_DETAILS',
      recipientType: 'GUEST',
      recipientContact: guest.guest_mobile,
      channel: 'WHATSAPP',
      message
    });
  }
}

// VEHICLE AND DRIVER CONFIRMATION FROM THE GARAGE CONTROLLER
private async getGarageUsers() {
  return this.db.query(`
    SELECT 
      u.user_id,
      s.full_name,
      s.primary_mobile
    FROM m_user u
    JOIN m_staff s ON s.staff_id = u.staff_id
    WHERE 
      u.is_active = TRUE
      AND s.is_active = TRUE
      AND LOWER(u.username) IN ('garage', 'gc', 'garage controller')
  `);
}
private async getDriverVehicleDetails(guestId: string) {
  const res = await this.db.query(`
    SELECT
      v.vehicle_number,
      v.vehicle_type,

      ds.full_name AS driver_name,
      ds.primary_mobile AS driver_contact,

      EXISTS(
        SELECT 1 FROM t_guest_vehicle 
        WHERE guest_id = $1 AND is_active = TRUE
      ) AS vehicle_assigned,

      EXISTS(
        SELECT 1 FROM t_guest_driver 
        WHERE guest_id = $1 AND is_active = TRUE
      ) AS driver_assigned

    FROM m_guest g

    LEFT JOIN t_guest_vehicle gv ON g.guest_id = gv.guest_id
    LEFT JOIN m_vehicle v ON gv.vehicle_id = v.vehicle_id

    LEFT JOIN t_guest_driver gd ON g.guest_id = gd.guest_id
    LEFT JOIN m_driver d ON gd.driver_id = d.driver_id
    LEFT JOIN m_staff ds ON d.staff_id = ds.staff_id

    WHERE g.guest_id = $1
  `, [guestId]);

  return res.rows[0];
}
private buildGarageAlertMessage(guestName: string, d: any): string {
  return `
🚗 Pickup Confirmation Required

Guest: ${guestName}

Arrival in approximately 3 hours.

🚘 Vehicle:
${d.vehicle_assigned 
  ? `Yes\nNumber: ${d.vehicle_number || '-'}\nType: ${d.vehicle_type || '-'}`
  : 'No'}

👨‍✈️ Driver:
${d.driver_assigned 
  ? `Yes\nName: ${d.driver_name || '-'}\nContact: ${d.driver_contact || '-'}`
  : 'No'}

Please confirm:
• Vehicle is ready
• Driver is available

Ensure timely pickup.
  `;
}
private async GarageNotification() {
  const guests = await this.getUpcomingGuests(4);
  const garageUsers = await this.getGarageUsers();

  for (const guest of guests.rows) {

    const arrivalTime = new Date(`${guest.entry_date} ${guest.entry_time}`);
    const now = new Date();

    const hoursLeft =
      (arrivalTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (!(hoursLeft <= 4 && hoursLeft >= 2)) continue;

    const details = await this.getDriverVehicleDetails(guest.guest_id);

    const message = this.buildGarageAlertMessage(
      guest.guest_name,
      details
    );

    for (const user of garageUsers.rows) {
      if (!user.primary_mobile) continue;

      await this.notificationsService.createNotification({
        guestId: guest.guest_id,
        inoutId: guest.inout_id,
        notificationType: 'T_MINUS_3_GARAGE_ALERT',
        recipientType: 'USER',
        recipientContact: user.primary_mobile,
        channel: 'WHATSAPP',
        message
      });
    }
  }
}
// GUEST PICKUP NOTIFICATION
private buildGuestPickupMessage(guestName: string, d: any): string {
  return `
🚗 Pickup Details for Your Arrival

Guest: ${guestName}

🚘 Vehicle:
${d.vehicle_assigned 
  ? `Number: ${d.vehicle_number || '-'}\nType: ${d.vehicle_type || '-'}`
  : 'Not assigned yet'}

👨‍✈️ Driver:
${d.driver_assigned 
  ? `Name: ${d.driver_name || '-'}\nContact: ${d.driver_contact || '-'}`
  : 'Not assigned yet'}

Our team is preparing for your arrival.
Safe travels!
  `;
}
private async guestPickupNotification() {
  const guests = await this.getUpcomingGuests(3);

  for (const guest of guests.rows) {

    if (!guest.requires_driver) continue; // ✅ important

    const arrivalTime = new Date(`${guest.entry_date} ${guest.entry_time}`);
    const now = new Date();

    const hoursLeft =
      (arrivalTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // 🎯 2-hour window
    if (!(hoursLeft <= 3 && hoursLeft >= 1)) continue;

    const details = await this.getDriverVehicleDetails(guest.guest_id);

    const message = this.buildGuestPickupMessage(
      guest.guest_name,
      details
    );

    await this.notificationsService.createNotification({
      guestId: guest.guest_id,
      inoutId: guest.inout_id,
      notificationType: 'T_MINUS_2_PICKUP_DETAILS',
      recipientType: 'GUEST',
      recipientContact: guest.guest_mobile,
      channel: 'WHATSAPP',
      message
    });
  }
}

// STAFF NOTIFICATIONS
private async getGuestAssignedStaff(guestId: string) {
  const res = await this.db.query(`
    SELECT * FROM (

      -- Butler
      SELECT 
        s.full_name,
        s.primary_mobile,
        'Butler' AS role
      FROM t_guest_butler gb
      JOIN m_butler b ON gb.butler_id = b.butler_id
      JOIN m_staff s ON b.staff_id = s.staff_id
      WHERE gb.guest_id = $1

      UNION ALL

      -- Room Boy
      SELECT 
        s.full_name,
        s.primary_mobile,
        'Room Boy' AS role
      FROM t_guest_hk gh
      JOIN m_housekeeping h ON gh.hk_id = h.hk_id
      JOIN m_staff s ON h.staff_id = s.staff_id
      WHERE gh.guest_id = $1

      UNION ALL

      -- Liaison
      SELECT 
        s.full_name,
        s.primary_mobile,
        'Liaison Officer' AS role
      FROM t_guest_liasoning_officer glo
      JOIN m_liasoning_officer lo ON glo.officer_id = lo.officer_id
      JOIN m_staff s ON lo.staff_id = s.staff_id
      WHERE glo.guest_id = $1

      UNION ALL

      -- Medical
      SELECT 
        s.full_name,
        s.primary_mobile,
        'Medical Officer' AS role
      FROM t_guest_medical_contact gmo
      JOIN m_medical_emergency_service mo ON gmo.service_id = mo.service_id
      JOIN m_staff s ON mo.staff_id = s.staff_id
      WHERE gmo.guest_id = $1

    ) staff
  `, [guestId]);

  return res.rows;
}
private buildStaffDutyMessage(
  staffName: string,
  role: string,
  guestName: string,
  arrivalTime: string
): string {
  return `
📢 Guest Assignment Notification

Hello ${staffName},

You have been assigned as ${role} for the following guest:

👤 Guest: ${guestName}
⏰ Arrival Time: ${arrivalTime}

Please ensure all preparations are completed before arrival.

Thank you.
  `;
}
private async staffDutyNotification() {
  const guests = await this.getUpcomingGuests(12);

  for (const guest of guests.rows) {

    const arrivalTime = new Date(`${guest.entry_date} ${guest.entry_time}`);
    const now = new Date();

    const hoursLeft =
      (arrivalTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // 🎯 12-hour window
    if (!(hoursLeft <= 13 && hoursLeft >= 11)) continue;

    const staffList = await this.getGuestAssignedStaff(guest.guest_id);

    for (const staff of staffList) {

      if (!staff.primary_mobile) continue;

      const message = this.buildStaffDutyMessage(
        staff.full_name,
        staff.role,
        guest.guest_name,
        `${guest.entry_date} ${guest.entry_time}`
      );

      await this.notificationsService.createNotification({
        guestId: guest.guest_id,
        inoutId: guest.inout_id,
        notificationType: 'T_MINUS_12_STAFF_DUTY',
        recipientType: 'USER',
        recipientContact: staff.primary_mobile,
        channel: 'WHATSAPP',
        message
      });
    }
  }
}
private async getDriverPickupDetails(guestId: string) {
  const res = await this.db.query(`
    SELECT
      gd.pickup_location,
      gd.drop_location,
      gd.trip_date,
      gd.start_time,

      s.full_name AS driver_name,
      s.primary_mobile AS driver_contact,

      gv.vehicle_no

    FROM t_guest_driver gd
    JOIN m_driver d ON gd.driver_id = d.driver_id
    JOIN m_staff s ON d.staff_id = s.staff_id

    LEFT JOIN t_guest_vehicle gv ON gd.guest_id = gv.guest_id

    WHERE gd.guest_id = $1
      AND gd.is_active = TRUE
  `, [guestId]);

  return res.rows[0];
}
private buildDriverPickupMessage(
  driverName: string,
  guestName: string,
  d: any
): string {
  return `
🚗 Pickup Duty Assigned

Hello ${driverName},

You have a pickup duty for the following guest:

👤 Guest: ${guestName}

📍 Pickup Location: ${d.pickup_location || '-'}
📍 Drop Location: ${d.drop_location || '-'}

🕒 Pickup Time: ${d.start_time || '-'}

🚘 Vehicle: ${d.vehicle_no || '-'}

Please ensure timely pickup and coordination.

Thank you.
  `;
}
private async driverPickupNotification() {
  const guests = await this.getUpcomingGuests(3);

  for (const guest of guests.rows) {

    if (!guest.requires_driver) continue;

    const arrivalTime = new Date(`${guest.entry_date} ${guest.entry_time}`);
    const now = new Date();

    const hoursLeft =
      (arrivalTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // 🎯 2-hour window
    if (!(hoursLeft <= 3 && hoursLeft >= 1)) continue;

    const details = await this.getDriverPickupDetails(guest.guest_id);

    if (!details || !details.driver_contact) continue;

    const message = this.buildDriverPickupMessage(
      details.driver_name,
      guest.guest_name,
      details
    );

    await this.notificationsService.createNotification({
      guestId: guest.guest_id,
      inoutId: guest.inout_id,
      notificationType: 'T_MINUS_2_DRIVER_PICKUP',
      recipientType: 'USER',
      recipientContact: details.driver_contact,
      channel: 'WHATSAPP',
      message
    });
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
