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
      this.db.query(`SELECT COUNT(*) FROM m_guest WHERE is_active = TRUE`),
      this.db.query(`
        SELECT COUNT(*) FROM t_guest_inout
        WHERE is_active = TRUE AND status = 'Inside'
      `),
      this.db.query(`
        SELECT COUNT(*) FROM t_guest_inout
        WHERE entry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '1 day'
      `),
      this.db.query(`
        SELECT COUNT(*) FROM t_guest_inout
        WHERE status = 'Exited' AND exit_date = CURRENT_DATE
      `),
      this.db.query(`SELECT COALESCE(ROUND(100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM m_rooms),0)),0) AS percent FROM t_guest_room WHERE is_active = TRUE`),
      this.db.query(`SELECT COALESCE(ROUND(100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM m_vehicle),0)),0) AS percent FROM t_guest_vehicle WHERE is_active = TRUE`),
      this.db.query(`SELECT COALESCE(ROUND(100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM t_room_housekeeping),0)),0) AS percent FROM t_room_housekeeping WHERE is_active = TRUE`),
      this.db.query(`SELECT COALESCE(ROUND(100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM m_notifications),0)),0) AS percent FROM m_notifications WHERE status = 'Unread'`),
      // this.db.query(`
      //   SELECT message, inserted_at AS timestamp
      //   FROM t_activity_log
      //   ORDER BY inserted_at DESC
      //   LIMIT 5
      // `),
    ]);

    return {
      guests: {
        total: Number(totalGuests.rows[0].count),
        checkedIn: Number(checkedIn.rows[0].count),
        upcomingArrivals: Number(upcomingArrivals.rows[0].count),
        checkedOutToday: Number(checkedOutToday.rows[0].count),
      },
      occupancy: {
        roomPercent: Number(roomOccupancy.rows[0].percent),
        vehiclePercent: Number(vehicleUsage.rows[0].percent),
        dutyRosterPercent: Number(dutyRoster.rows[0].percent),
        notificationPercent: Number(notifications.rows[0].percent),
      },
      recentActivity: recentActivity.rows,
    };
  }
}
