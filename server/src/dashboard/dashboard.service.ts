import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

@Injectable()
export class DashboardService {
  constructor(private readonly db: DatabaseService) {}

  async getOverview() {
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
      // ================= GUEST STATS =================

      // Total Guests
      this.db.query(`
        SELECT COUNT(*) 
        FROM m_guest 
        WHERE is_active = TRUE
      `),

      // Checked In → guest entered and not exited yet
      this.db.query(`
        SELECT COUNT(*)
        FROM t_guest_inout
        WHERE is_active = TRUE
          AND guest_inout = TRUE
          AND exit_date IS NULL
      `),

      // Upcoming Arrivals → entry in next 24 hours
      this.db.query(`
        SELECT COUNT(*)
        FROM t_guest_inout
        WHERE is_active = TRUE
          AND guest_inout = TRUE
          AND entry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '1 day'
      `),

      // Checked Out Today → exited today
      this.db.query(`
        SELECT COUNT(*)
        FROM t_guest_inout
        WHERE is_active = TRUE
          AND exit_date = CURRENT_DATE
      `),

      // ================= OCCUPANCY =================

      this.db.query(`
        SELECT COALESCE(
          ROUND(
            100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM m_rooms), 0)
          ), 
          0
        ) AS percent
        FROM t_guest_room
        WHERE is_active = TRUE
        AND CURRENT_DATE BETWEEN check_in_date AND check_out_date
      `),

      this.db.query(`
        SELECT COALESCE(
          ROUND(
            100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM m_vehicle), 0)
          ), 
          0
        ) AS percent
        FROM t_guest_vehicle
        WHERE is_active = TRUE
      `),

      this.db.query(`
        SELECT COALESCE(
          ROUND(
            100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM t_guest_hk), 0)
          ), 
          0
        ) AS percent
        FROM t_guest_hk
        WHERE is_active = TRUE
      `),

      this.db.query(`
        SELECT COALESCE(
          ROUND(
            100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM m_notifications), 0)
          ), 
          0
        ) AS percent
        FROM m_notifications
        WHERE status = 'Unread'
      `),

      // ================= RECENT ACTIVITY =================
      this.db.query(`
        SELECT 
          message, 
          inserted_at AS timestamp
        FROM t_activity_log
        WHERE is_active = TRUE
        ORDER BY inserted_at DESC
        LIMIT 5
      `),
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
}
