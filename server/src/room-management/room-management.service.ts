import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class RoomManagementService {
  constructor(private readonly db: DatabaseService) {}

  async getOverview() {
    /**
     * ONE query
     * ONE row per room
     * LEFT JOIN everything that is "current"
     */
    const sql = `
      SELECT
        r.room_id,
        r.room_no,
        r.room_name,
        r.residence_type,
        r.room_capacity,
        r.status,

        gr.guest_room_id,
        g.guest_id,
        g.guest_name,

        rh.guest_hk_id,
        rh.hk_id,
        hk.hk_name,
        rh.status AS housekeeping_status

      FROM m_rooms r

      -- Active guest in room
      LEFT JOIN t_guest_room gr
        ON gr.room_id = r.room_id
       AND gr.is_active = TRUE

      LEFT JOIN m_guest g
        ON g.guest_id = gr.guest_id
       AND g.is_active = TRUE

      -- Active housekeeping task
      LEFT JOIN t_room_housekeeping rh
        ON rh.room_id = r.room_id
       AND rh.status = 'Scheduled'

      LEFT JOIN m_housekeeping hk
        ON hk.hk_id = rh.hk_id
       AND hk.is_active = TRUE

      WHERE r.is_active = TRUE
      ORDER BY r.room_no;
    `;

    const { rows } = await this.db.query(sql);

    /**
     * Shape the data EXACTLY how frontend needs it
     */
    return rows.map((r) => ({
      roomId: r.room_id,
      roomNo: r.room_no,
      roomName: r.room_name,
      residenceType: r.residence_type,
      capacity: r.room_capacity,
      status: r.status,

      guest: r.guest_id
        ? {
            guestId: r.guest_id,
            guestName: r.guest_name,
            guestRoomId: r.guest_room_id,
          }
        : null,

      housekeeping: r.guest_hk_id
        ? {
            guestHkId: r.guest_hk_id,
            hkId: r.hk_id,
            hkName: r.hk_name,
            status: r.housekeeping_status,
          }
        : null,
    }));
  }
}
