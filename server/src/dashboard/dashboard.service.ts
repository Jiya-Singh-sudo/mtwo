import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

@Injectable()
export class DashboardService {
  constructor(private readonly db: DatabaseService) {}

  async getOverview(fromDate?: string, toDate?: string) {
    const today = new Date().toISOString().split("T")[0];

    const from = fromDate || today;
    const to = toDate || today;

    const [
      totalGuests,
      checkedIn,
      upcomingArrivals,
      checkedOutToday,
      roomOccupancy,
      vehicleUsage,
      dutyRoster,
      notifications,
      recentActivity,
    ] = await Promise.all([
  this.db.query(`
    SELECT COUNT(*) 
    FROM t_guest_inout
    WHERE is_active = TRUE
      AND guest_inout = TRUE
      AND entry_date <= $2
      AND (exit_date IS NULL OR exit_date >= $1)
  `, [from, to]),
  this.db.query(`
    SELECT COUNT(*)
    FROM t_guest_inout
    WHERE is_active = TRUE
      AND guest_inout = TRUE
      AND status = 'Entered'
      AND DATE(entry_date) BETWEEN $1 AND $2
  `, [from, to]),
  this.db.query(`
    SELECT COUNT(*)
    FROM t_guest_inout
    WHERE is_active = TRUE
      AND guest_inout = TRUE
      AND status = 'Scheduled'
      AND entry_date <= $1
      AND exit_date >= $2
  `, [from, to]),
  this.db.query(`
    SELECT COUNT(*)
    FROM t_guest_inout
    WHERE status = 'Exited'
      AND DATE(exit_date) BETWEEN $1 AND $2
  `, [from, to]),
  this.db.query(`
    SELECT COALESCE(
      ROUND(
        100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM m_rooms), 0)
      ), 
      0
    ) AS percent
    FROM t_guest_room
    WHERE is_active = TRUE
    AND check_in_date <= $2
    AND (check_out_date IS NULL OR check_out_date >= $1)
  `, [from, to]),
  this.db.query(`
    SELECT COALESCE(
      ROUND(
        100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM m_vehicle), 0)
      ), 
      0
    ) AS percent
    FROM t_guest_vehicle
    WHERE is_active = TRUE
    AND DATE(assigned_at) BETWEEN $1 AND $2
  `, [from, to]),
  this.db.query(`
    SELECT COALESCE(
      ROUND(
        100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM t_guest_hk), 0)
      ), 
      0
    ) AS percent
    FROM t_guest_hk
    WHERE is_active = TRUE
    AND DATE(assignment_date) BETWEEN $1 AND $2
  `, [from, to]),
  this.db.query(`
    SELECT COALESCE(
      ROUND(
        100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM m_notifications), 0)
      ), 
      0
    ) AS percent
    FROM notifications
    WHERE status = 'Unread'
    AND DATE(sent_at) BETWEEN $1 AND $2
  `, [from, to]),
  this.db.query(`
    SELECT 
      message, 
      inserted_at AS timestamp
    FROM t_activity_log
    WHERE is_active = TRUE
    AND DATE(inserted_at) BETWEEN $1 AND $2
    ORDER BY inserted_at DESC
    LIMIT 5
  `, [from, to]),
  ]);

  return {
    guests: {
      total: Number(totalGuests?.rows?.[0]?.count ?? 0),
      checkedIn: Number(checkedIn?.rows?.[0]?.count ?? 0),
      upcomingArrivals: Number(upcomingArrivals?.rows?.[0]?.count ?? 0),
      checkedOutToday: Number(checkedOutToday?.rows?.[0]?.count ?? 0),
    },

    occupancy: {
      roomPercent: Number(roomOccupancy?.rows?.[0]?.percent ?? 0),
      vehiclePercent: Number(vehicleUsage?.rows?.[0]?.percent ?? 0),
      dutyRosterPercent: Number(dutyRoster?.rows?.[0]?.percent ?? 0),
      notificationPercent: Number(notifications?.rows?.[0]?.percent ?? 0),
    },

    recentActivity: recentActivity?.rows ?? [],
  };
  }

  // async getOverview() {
  //   const [
  //     totalGuests,
  //     checkedIn,
  //     upcomingArrivals,
  //     checkedOutToday,
  //     roomOccupancy,
  //     vehicleUsage,
  //     dutyRoster,
  //     notifications,
  //     recentActivity,
  //   ] = await Promise.all([
  //     // ================= GUEST STATS =================

  //     // Total Guests
  //     this.db.query(`
  //       SELECT COUNT(*) 
  //       FROM m_guest 
  //       WHERE is_active = TRUE
  //     `),

  //     // Checked In → guest entered and not exited yet
  //     this.db.query(`
  //       SELECT COUNT(*)
  //       FROM t_guest_inout
  //       WHERE is_active = TRUE
  //         AND guest_inout = TRUE
  //         AND status = 'Entered'
  //     `),

  //     // Upcoming Arrivals → entry in next 24 hours
  //     this.db.query(`
  //       SELECT COUNT(*)
  //       FROM t_guest_inout
  //       WHERE is_active = TRUE
  //         AND guest_inout = TRUE
  //         AND status = 'Scheduled'
  //         AND (entry_date::timestamp + entry_time)
  //         BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
  //     `),

  //     // Checked Out Today → exited today
  //     this.db.query(`
  //       SELECT COUNT(*)
  //       FROM t_guest_inout
  //       WHERE status = 'Exited'
  //     `),

  //     // ================= OCCUPANCY =================

  //     this.db.query(`
  //       SELECT COALESCE(
  //         ROUND(
  //           100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM m_rooms), 0)
  //         ), 
  //         0
  //       ) AS percent
  //       FROM t_guest_room
  //       WHERE is_active = TRUE
  //       AND CURRENT_DATE BETWEEN check_in_date AND check_out_date
  //     `),

  //     this.db.query(`
  //       SELECT COALESCE(
  //         ROUND(
  //           100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM m_vehicle), 0)
  //         ), 
  //         0
  //       ) AS percent
  //       FROM t_guest_vehicle
  //       WHERE is_active = TRUE
  //     `),

  //     this.db.query(`
  //       SELECT COALESCE(
  //         ROUND(
  //           100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM t_guest_hk), 0)
  //         ), 
  //         0
  //       ) AS percent
  //       FROM t_guest_hk
  //       WHERE is_active = TRUE
  //     `),

  //     this.db.query(`
  //       SELECT COALESCE(
  //         ROUND(
  //           100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM m_notifications), 0)
  //         ), 
  //         0
  //       ) AS percent
  //       FROM m_notifications
  //       WHERE status = 'Unread'
  //     `),

  //     // ================= RECENT ACTIVITY =================
  //     this.db.query(`
  //       SELECT 
  //         message, 
  //         inserted_at AS timestamp
  //       FROM t_activity_log
  //       WHERE is_active = TRUE
  //       ORDER BY inserted_at DESC
  //       LIMIT 5
  //     `),
  //   ]);

  //   return {
  //     guests: {
  //       total: Number(totalGuests?.rows?.[0]?.count ?? 0),
  //       checkedIn: Number(checkedIn?.rows?.[0]?.count ?? 0),
  //       upcomingArrivals: Number(upcomingArrivals?.rows?.[0]?.count ?? 0),
  //       checkedOutToday: Number(checkedOutToday?.rows?.[0]?.count ?? 0),
  //     },

  //     occupancy: {
  //       roomPercent: Number(roomOccupancy?.rows?.[0]?.percent ?? 0),
  //       vehiclePercent: Number(vehicleUsage?.rows?.[0]?.percent ?? 0),
  //       dutyRosterPercent: Number(dutyRoster?.rows?.[0]?.percent ?? 0),
  //       notificationPercent: Number(notifications?.rows?.[0]?.percent ?? 0),
  //     },

  //     recentActivity: recentActivity?.rows ?? [],
  //   };
  // }
    // ================= FULL LIVE DASHBOARD =================
  async getFullLiveDashboard(fromDate?: string, toDate?: string) {
    const today = new Date().toISOString().split("T")[0];

    const from = fromDate || today;
    const to = toDate || today;
    const [guest, room, transport, staff, food] = await Promise.all([
      this.getGuestStats(),
      this.getRoomStats(),
      this.getTransportStats(),
      this.getStaffStats(),
      this.getFoodStats(),
    ]);

    return { guest, room, transport, staff, food };
  }
// ================= GUEST =================
  async getGuestStats() {
    
    const [scheduled, current, checkout] = await Promise.all([
      this.db.query(`
        SELECT COUNT(*) FROM t_guest_inout
        WHERE is_active = TRUE
          AND status = 'Scheduled'
          AND entry_date = CURRENT_DATE
      `),

      this.db.query(`
        SELECT COUNT(*) FROM t_guest_inout
        WHERE is_active = TRUE
          AND status IN ('Entered')
      `),

      this.db.query(`
        SELECT COUNT(*) FROM t_guest_inout
        WHERE is_active = TRUE
          AND status = 'Exited'
          AND exit_date = CURRENT_DATE
      `),
    ]);

    return {
      scheduledCheckins: Number(scheduled.rows[0].count),
      currentGuests: Number(current.rows[0].count),
      checkoutsToday: Number(checkout.rows[0].count),
      vvipGuests: 0, // not implemented in DB
    };
  }

  // ================= ROOM =================
  async getRoomStats() {
    const [occupied, deluxe, standard, cleaning] = await Promise.all([
      this.db.query(`
        SELECT COUNT(*) FROM t_guest_room
        WHERE is_active = TRUE
          AND check_in_date <= CURRENT_DATE
          AND (check_out_date IS NULL OR check_out_date >= CURRENT_DATE)
      `),

      this.db.query(`
        SELECT COUNT(*) FROM t_guest_room gr
        JOIN m_rooms r ON r.room_id = gr.room_id
        WHERE gr.is_active = TRUE
          AND r.room_category = 'Deluxe'
          AND gr.check_in_date <= CURRENT_DATE
          AND (gr.check_out_date IS NULL OR gr.check_out_date >= CURRENT_DATE)
      `),

      this.db.query(`
        SELECT COUNT(*) FROM t_guest_room gr
        JOIN m_rooms r ON r.room_id = gr.room_id
        WHERE gr.is_active = TRUE
          AND r.room_category = 'Standard'
          AND gr.check_in_date <= CURRENT_DATE
          AND (gr.check_out_date IS NULL OR gr.check_out_date >= CURRENT_DATE)
      `),

      this.db.query(`
        SELECT COUNT(*) FROM t_guest_hk
        WHERE is_active = TRUE
      `),
    ]);

    return {
      occupied: Number(occupied.rows[0].count),
      deluxe: Number(deluxe.rows[0].count),
      standard: Number(standard.rows[0].count),
      cleaning: Number(cleaning.rows[0].count),
    };
  }

  // ================= TRANSPORT =================
  async getTransportStats() {
    const [vehicles, drivers, pickups, routes] = await Promise.all([
      this.db.query(`
        SELECT COUNT(*) FROM t_guest_vehicle
        WHERE is_active = TRUE
          AND assigned_at IS NOT NULL
          AND released_at IS NULL
      `),

      this.db.query(`
        SELECT COUNT(*) FROM t_driver_duty
        WHERE is_active = TRUE
          AND duty_date = CURRENT_DATE
          AND is_week_off = FALSE
      `),

      this.db.query(`
        SELECT COUNT(*) FROM t_guest_driver
        WHERE is_active = TRUE
          AND trip_date = CURRENT_DATE
      `),

      this.db.query(`
        SELECT COUNT(*) FROM t_guest_driver
        WHERE is_active = TRUE
      `),
    ]);

    return {
      vehicles: Number(vehicles.rows[0].count),
      drivers: Number(drivers.rows[0].count),
      pickups: Number(pickups.rows[0].count),
      routes: Number(routes.rows[0].count),
    };
  }

  // ================= STAFF =================
  async getStaffStats() {
    const [roomBoys, butlers] = await Promise.all([
      this.db.query(`
        SELECT COUNT(*) FROM m_housekeeping
        WHERE is_active = TRUE
      `),

      this.db.query(`
        SELECT COUNT(*) FROM m_butler
        WHERE is_active = TRUE
      `),
    ]);

    return {
      roomBoys: Number(roomBoys.rows[0].count),
      butlers: Number(butlers.rows[0].count),
      requests: 0, // not implemented
      tasks: 0, // not implemented
    };
  }

  // ================= FOOD =================
  async getFoodStats() {
    const [breakfast, lunch, dinner, diet] = await Promise.all([
      this.db.query(`
        SELECT COUNT(*) FROM t_guest_food
        WHERE is_active = TRUE
          AND meal_type = 'Breakfast'
          AND plan_date = CURRENT_DATE
      `),

      this.db.query(`
        SELECT COUNT(*) FROM t_daily_meal_plan
        WHERE is_active = TRUE
          AND meal_type = 'Lunch'
          AND plan_date = CURRENT_DATE
      `),

      this.db.query(`
        SELECT COUNT(*) FROM t_guest_food
        WHERE is_active = TRUE
          AND meal_type = 'Dinner'
          AND plan_date = CURRENT_DATE
      `),

      this.db.query(`
        SELECT COUNT(*) FROM t_guest_food
        WHERE is_active = TRUE
          AND plan_date = CURRENT_DATE
      `),
    ]);

    return {
      breakfast: Number(breakfast.rows[0].count),
      lunch: Number(lunch.rows[0].count),
      dinner: Number(dinner.rows[0].count),
      diet: Number(diet.rows[0].count),
    };
  }
  // async getGuestStats() {
  //   const [
  //     scheduledCheckins,
  //     currentGuests,
  //     checkoutsToday,
  //     vvipGuests,

  //     occupiedRooms,
  //     deluxeRooms,
  //     standardRooms,
  //     cleaning,

  //     vehiclesOnDuty,
  //     driversAssigned,
  //     pickups,
  //     activeRoutes,

  //     roomBoys,
  //     butlers,
  //     serviceRequests,
  //     tasksCompleted,

  //     breakfast,
  //     lunch,
  //     dinner,
  //     dietRequests
  //   ] = await Promise.all([

  //     // ===== GUEST =====
  //     // Scheduled Check-ins Today
  //     this.db.query(`
  //       SELECT COUNT(*)
  //       FROM t_guest_inout
  //       WHERE is_active = TRUE
  //         AND status = 'Scheduled'
  //         AND entry_date = CURRENT_DATE
  //     `),

  //     // Current Guests
  //     this.db.query(`
  //       SELECT COUNT(*)
  //       FROM t_guest_inout
  //       WHERE is_active = TRUE
  //         AND status IN ('Entered', 'Inside')
  //     `),

  //     // Check-outs Today
  //     this.db.query(`
  //       SELECT COUNT(*)
  //       FROM t_guest_inout
  //       WHERE is_active = TRUE
  //         AND status = 'Exited'
  //         AND exit_date = CURRENT_DATE
  //     `),

  //     // VVIP Guests (TEMP)
  //     this.db.query(`
  //       SELECT 0 AS count
  //     `),

  //     // ===== ROOM =====
  //     // Occupied Rooms
  //     this.db.query(`
  //       SELECT COUNT(*)
  //       FROM t_guest_room
  //       WHERE is_active = TRUE
  //         AND check_in_date <= CURRENT_DATE
  //         AND (check_out_date IS NULL OR check_out_date >= CURRENT_DATE)
  //     `),

  //     // Deluxe Rooms Occupied
  //     this.db.query(`
  //       SELECT COUNT(*)
  //       FROM t_guest_room gr
  //       JOIN m_rooms r ON r.room_id = gr.room_id
  //       WHERE gr.is_active = TRUE
  //         AND r.room_category = 'Deluxe'
  //         AND gr.check_in_date <= CURRENT_DATE
  //         AND (gr.check_out_date IS NULL OR gr.check_out_date >= CURRENT_DATE)
  //     `),

  //     // Standard Rooms Occupied
  //     this.db.query(`
  //       SELECT COUNT(*)
  //       FROM t_guest_room gr
  //       JOIN m_rooms r ON r.room_id = gr.room_id
  //       WHERE gr.is_active = TRUE
  //         AND r.room_category = 'Standard'
  //         AND gr.check_in_date <= CURRENT_DATE
  //         AND (gr.check_out_date IS NULL OR gr.check_out_date >= CURRENT_DATE)
  //     `),

  //     // Cleaning in Progress (verify enum)
  //     this.db.query(`
  //       SELECT COUNT(*)
  //       FROM t_guest_hk
  //       WHERE is_active = TRUE
  //         AND status = 'In Progress'
  //     `),

  //     // ===== TRANSPORT =====
  //     // Vehicles on Duty
  //     this.db.query(`
  //       SELECT COUNT(*)
  //       FROM t_guest_vehicle
  //       WHERE is_active = TRUE
  //         AND assigned_at IS NOT NULL
  //         AND released_at IS NULL
  //     `),

  //     // Drivers Assigned Today
  //     this.db.query(`
  //       SELECT COUNT(*)
  //       FROM t_driver_duty
  //       WHERE is_active = TRUE
  //         AND duty_date = CURRENT_DATE
  //         AND is_week_off = FALSE
  //     `),

  //     // Scheduled Pickups
  //     this.db.query(`
  //       SELECT COUNT(*)
  //       FROM t_guest_driver
  //       WHERE is_active = TRUE
  //         AND trip_date = CURRENT_DATE
  //         AND trip_status = 'Scheduled'
  //     `),

  //     // Active Routes
  //     this.db.query(`
  //       SELECT COUNT(*)
  //       FROM t_guest_driver
  //       WHERE is_active = TRUE
  //         AND trip_status = 'Ongoing'
  //     `),

  //     // ===== STAFF =====
  //     // Room Boys on Duty
  //     this.db.query(`
  //       SELECT COUNT(*)
  //       FROM m_housekeeping
  //       WHERE is_active = TRUE
  //     `),

  //     // Butlers Assigned
  //     this.db.query(`
  //       SELECT COUNT(*)
  //       FROM m_butler
  //       WHERE is_active = TRUE
  //     `),

  //     // Service Requests Today (TEMP - no table)
  //     this.db.query(`
  //       SELECT 0 AS count
  //     `),

  //     // Tasks Completed (TEMP - no table)
  //     this.db.query(`
  //       SELECT 0 AS count
  //     `),

  //     // ===== FOOD =====
  //     // Breakfast Orders
  //     this.db.query(`
  //       SELECT COUNT(*)
  //       FROM t_guest_food
  //       WHERE is_active = TRUE
  //         AND meal_type = 'Breakfast'
  //         AND plan_date = CURRENT_DATE
  //     `),

  //     // Lunch Scheduled
  //     this.db.query(`
  //       SELECT COUNT(*)
  //       FROM t_daily_meal_plan
  //       WHERE is_active = TRUE
  //         AND meal_type = 'Lunch'
  //         AND plan_date = CURRENT_DATE
  //     `),

  //     // Dinner Reservations
  //     this.db.query(`
  //       SELECT COUNT(*)
  //       FROM t_guest_food
  //       WHERE is_active = TRUE
  //         AND meal_type = 'Dinner'
  //         AND plan_date = CURRENT_DATE
  //     `),

  //     // Special Dietary Requests
  //     this.db.query(`
  //       SELECT COUNT(*)
  //       FROM t_guest_food
  //       WHERE is_active = TRUE
  //         AND remarks IS NOT NULL
  //         AND plan_date = CURRENT_DATE
  //     `),
  //   ]);

  //   return {
  //     guest: {
  //       scheduledCheckins: Number(scheduledCheckins.rows[0].count),
  //       currentGuests: Number(currentGuests.rows[0].count),
  //       checkoutsToday: Number(checkoutsToday.rows[0].count),
  //       vvipGuests: Number(vvipGuests.rows[0].count),
  //     },
  //     room: {
  //       occupied: Number(occupiedRooms.rows[0].count),
  //       deluxe: Number(deluxeRooms.rows[0].count),
  //       standard: Number(standardRooms.rows[0].count),
  //       cleaning: Number(cleaning.rows[0].count),
  //     },
  //     transport: {
  //       vehicles: Number(vehiclesOnDuty.rows[0].count),
  //       drivers: Number(driversAssigned.rows[0].count),
  //       pickups: Number(pickups.rows[0].count),
  //       routes: Number(activeRoutes.rows[0].count),
  //     },
  //     staff: {
  //       roomBoys: Number(roomBoys.rows[0].count),
  //       butlers: Number(butlers.rows[0].count),
  //       requests: Number(serviceRequests.rows[0].count),
  //       tasks: Number(tasksCompleted.rows[0].count),
  //     },
  //     food: {
  //       breakfast: Number(breakfast.rows[0].count),
  //       lunch: Number(lunch.rows[0].count),
  //       dinner: Number(dinner.rows[0].count),
  //       diet: Number(dietRequests.rows[0].count),
  //     }
  //   };
  // }
}
