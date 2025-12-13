import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateGuestRoomDto } from "./dto/create-guest-room.dto";
import { UpdateGuestRoomDto } from "./dto/update-guest-room.dto";

@Injectable()
export class GuestRoomService {
  constructor(private readonly db: DatabaseService) {}

  private async generateId(): Promise<string> {
    const sql = `SELECT guest_room_id FROM t_guest_room ORDER BY guest_room_id DESC LIMIT 1`;
    const res = await this.db.query(sql);
    if (res.rows.length === 0) return "GR001";
    const last = res.rows[0].guest_room_id.replace("GR", "");
    const next = (parseInt(last, 10) + 1).toString().padStart(3, "0");
    return `GR${next}`;
  }
  //Guest Management page - table view(guests, rooms)
  async getRoomOverview() {
    // 1️⃣ Auto-close expired stays (checkout date = today)
    await this.db.query(`
      UPDATE t_guest_room
      SET is_active = FALSE,
          updated_at = NOW()
      WHERE is_active = TRUE
        AND check_out_date IS NOT NULL
        AND check_out_date <= CURRENT_DATE
    `);

    // 2️⃣ Fetch room state snapshot
    const sql = `
      SELECT
        r.room_id,
        r.room_no,
        r.room_name,
        r.residence_type,
        r.room_capacity,
        r.status AS room_status,

        gr.guest_room_id,
        gr.check_in_date,
        gr.check_out_date,

        g.guest_id,
        g.guest_name

      FROM m_rooms r
      LEFT JOIN t_guest_room gr
        ON gr.room_id = r.room_id
      AND gr.is_active = TRUE
      LEFT JOIN m_guest g
        ON g.guest_id = gr.guest_id
      AND g.is_active = TRUE
      WHERE r.is_active = TRUE
      ORDER BY r.room_no;
    `;

    const res = await this.db.query(sql);
    return res.rows;
  }

  async activeGuestsDropDown(){
    const sql = `SELECT
                  io.guest_id,
                  g.guest_name
                FROM t_guest_inout io
                JOIN m_guest g ON g.guest_id = io.guest_id
                WHERE io.is_active = TRUE
                ORDER BY g.guest_name;
                `;
    const res = await this.db.query(sql);
    return res.rows;
  }

  //Guest Management page - vacate
  async vacate(guestRoomId: string, user: string, ip: string) {
    await this.db.query('BEGIN');

    try {
      // 1️⃣ Fetch active stay
      const res = await this.db.query(`
        SELECT room_id
        FROM t_guest_room
        WHERE guest_room_id = $1
          AND is_active = TRUE
      `, [guestRoomId]);

      if (!res.rowCount) {
        throw new Error('No active room assignment found');
      }

      const roomId = res.rows[0].room_id;

      // 2️⃣ Close stay
      await this.db.query(`
        UPDATE t_guest_room
        SET is_active = FALSE,
            check_out_date = CURRENT_DATE,
            updated_at = NOW(),
            updated_by = $2,
            updated_ip = $3
        WHERE guest_room_id = $1
      `, [guestRoomId, user, ip]);

      // 3️⃣ Make room available
      await this.db.query(`
        UPDATE m_rooms
        SET status = 'Available'
        WHERE room_id = $1
      `, [roomId]);

      await this.db.query('COMMIT');
      return { success: true };

    } catch (err) {
      await this.db.query('ROLLBACK');
      throw err;
    }
  }




  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `SELECT * FROM t_guest_room WHERE is_active = $1 ORDER BY action_date DESC, action_time DESC`
      : `SELECT * FROM t_guest_room ORDER BY action_date DESC, action_time DESC`;
    const res = await this.db.query(sql, activeOnly ? [true] : []);
    return res.rows;
  }

  async findOne(id: string) {
    const sql = `SELECT * FROM t_guest_room WHERE guest_room_id = $1`;
    const res = await this.db.query(sql, [id]);
    return res.rows[0];
  }

  async create(dto: CreateGuestRoomDto, user: string, ip: string) {
    await this.db.query('BEGIN');

    try {
      // 1️⃣ Ensure guest is active (from t_guest_inout)
      const guestCheck = await this.db.query(`
        SELECT 1 FROM t_guest_inout
        WHERE guest_id = $1 AND is_active = TRUE
      `, [dto.guest_id]);

      if (!guestCheck.rowCount) {
        throw new Error('Guest is not currently active');
      }

      // 2️⃣ Ensure room is available
      const roomCheck = await this.db.query(`
        SELECT status FROM m_rooms
        WHERE room_id = $1 AND is_active = TRUE
      `, [dto.room_id]);

      if (!roomCheck.rowCount || roomCheck.rows[0].status !== 'Available') {
        throw new Error('Room is not available');
      }

      // 3️⃣ Generate guest_room_id
      const guestRoomId = await this.generateId();

      // 4️⃣ Insert t_guest_room
      await this.db.query(`
        INSERT INTO t_guest_room (
          guest_room_id,
          guest_id,
          room_id,
          check_in_date,
          check_in_time,
          check_out_date,
          action_type,
          action_description,
          remarks,
          is_active,
          inserted_at,
          inserted_by,
          inserted_ip
        ) VALUES (
          $1,$2,$3,$4, CURRENT_TIME, $5,
          'Room-Allocated',$6,$7,
          TRUE, NOW(), $8, $9
        )
      `, [
        guestRoomId,
        dto.guest_id,
        dto.room_id,
        dto.check_in_date,
        dto.check_out_date,
        dto.remarks,
        user,
        ip
      ]);

      // 5️⃣ Update room status
      await this.db.query(`
        UPDATE m_rooms SET status = 'Occupied'
        WHERE room_id = $1
      `, [dto.room_id]);

      await this.db.query('COMMIT');
      return { guest_room_id: guestRoomId };

    } catch (err) {
      await this.db.query('ROLLBACK');
      console.error("GuestRoom Create Error:", err);
      throw err;
    }
  }


  // async create(dto: CreateGuestRoomDto, user: string, ip: string) {
  //   const id = await this.generateId();
  //   const now = new Date().toISOString();

  //   // Use DB defaults for action_date/action_time when dto.action_date/time are not provided
  //   const sql = `
  //     INSERT INTO t_guest_room (
  //       guest_room_id,
  //       guest_id,
  //       room_id,
  //       check_in_date, check_in_time,
  //       check_out_date, check_out_time,
  //       action_type, action_description,
  //       action_date, action_time,
  //       remarks,
  //       is_active,
  //       inserted_at, inserted_by, inserted_ip
  //     ) VALUES (
  //       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true,$13,$14,$15
  //     )
  //     RETURNING *;
  //   `;

  //   const params = [
  //     id,
  //     // required guest
  //     (dto as any).guest_id,
  //     dto.room_id ?? null,
  //     dto.check_in_date ?? null,
  //     dto.check_in_time ?? null,
  //     dto.check_out_date ?? null,
  //     dto.check_out_time ?? null,
  //     dto.action_type,
  //     dto.action_description ?? null,
  //     // pass null to use DB defaults for action_date/time if not provided
  //     dto.action_date ?? null,
  //     dto.action_time ?? null,
  //     dto.remarks ?? null,
  //     now,
  //     user,
  //     ip,
  //   ];

  //   const res = await this.db.query(sql, params);
  //   return res.rows[0];
  // }

  async update(id: string, dto: UpdateGuestRoomDto, user: string, ip: string) {
    const existing = await this.findOne(id);
    if (!existing) throw new Error(`Guest Room entry '${id}' not found`);

    const now = new Date().toISOString();
    if (dto.status === 'Available') {
      await this.db.query(`
        UPDATE t_guest_room
        SET is_active = FALSE,
            check_out_date = CURRENT_DATE,
            updated_at = NOW()
        WHERE room_id = $1
          AND is_active = TRUE
      `, [existing.room_id]);
    }


    const sql = `
      UPDATE t_guest_room SET
        room_id = $1,
        check_in_date = $2,
        check_in_time = $3,
        check_out_date = $4,
        check_out_time = $5,
        action_type = $6,
        action_description = $7,
        action_date = $8,
        action_time = $9,
        remarks = $10,
        is_active = $11,
        updated_at = $12,
        updated_by = $13,
        updated_ip = $14
      WHERE guest_room_id = $15
      RETURNING *;
    `;

    const params = [
      dto.room_id ?? existing.room_id,
      dto.check_in_date ?? existing.check_in_date,
      dto.check_in_time ?? existing.check_in_time,
      dto.check_out_date ?? existing.check_out_date,
      dto.check_out_time ?? existing.check_out_time,
      dto.action_type ?? existing.action_type,
      dto.action_description ?? existing.action_description,
      dto.action_date ?? existing.action_date,
      dto.action_time ?? existing.action_time,
      dto.remarks ?? existing.remarks,
      dto.is_active ?? existing.is_active,
      now,
      user,
      ip,
      id,
    ];

    const res = await this.db.query(sql, params);
    return res.rows[0];
  }

  async softDelete(id: string, user: string, ip: string) {
    const now = new Date().toISOString();
    const sql = `
      UPDATE t_guest_room SET
        is_active = false,
        updated_at = $1,
        updated_by = $2,
        updated_ip = $3
      WHERE guest_room_id = $4
      RETURNING *;
    `;
    const res = await this.db.query(sql, [now, user, ip, id]);
    return res.rows[0];
  }
}
