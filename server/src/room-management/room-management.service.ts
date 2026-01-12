import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EditRoomFullDto } from './dto/editFullRoom.dto';
const SORT_MAP: Record<string, string> = {
  room_no: 'r.room_no',
  room_name: 'r.room_name',
  status: 'r.status',
};

@Injectable()
export class RoomManagementService {
  constructor(private readonly db: DatabaseService) {}

  /* ================= OVERVIEW ================= */

  async getOverview({
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    status,
  }: {
    page: number;
    limit: number;
    search?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    status?: 'Available' | 'Occupied';
  }) {
    const sortColumn = SORT_MAP[sortBy] ?? 'r.room_no';
    const order = sortOrder === 'desc' ? 'DESC' : 'ASC';
    const offset = (page - 1) * limit;

    /* ================= WHERE + PARAMS ================= */

    const whereParts: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (search) {
      whereParts.push(`
        (
          r.room_no ILIKE $${idx}
          OR r.room_name ILIKE $${idx}
          OR g.guest_name ILIKE $${idx}
        )
      `);
      params.push(`%${search}%`);
      idx++;
    }

    if (status) {
      whereParts.push(`r.status = $${idx}`);
      params.push(status);
      idx++;
    }

    const whereSql =
      whereParts.length > 0 ? `AND ${whereParts.join(' AND ')}` : '';

    /* ================= COUNT ================= */

    const countSql = `
      SELECT COUNT(*)::int AS count
      FROM m_rooms r
      LEFT JOIN t_guest_room gr
        ON gr.room_id = r.room_id AND gr.is_active = true
      LEFT JOIN m_guest g
        ON g.guest_id = gr.guest_id
      WHERE r.is_active = true
      ${whereSql}
    `;

    /* ================= STATS (filtered) ================= */

    const statsSql = `
      SELECT
        COUNT(*)                                           AS total,
        COUNT(*) FILTER (WHERE r.status = 'Available')     AS available,
        COUNT(*) FILTER (WHERE r.status = 'Occupied')      AS occupied,
        COUNT(*) FILTER (WHERE gr.guest_id IS NOT NULL)    AS with_guest,
        COUNT(*) FILTER (WHERE gh.guest_hk_id IS NOT NULL) AS with_housekeeping
      FROM m_rooms r
      LEFT JOIN t_guest_room gr
        ON gr.room_id = r.room_id AND gr.is_active = true
      LEFT JOIN t_room_housekeeping gh
        ON gh.room_id = r.room_id AND gh.is_active = true
      WHERE r.is_active = true
      ${whereSql}
    `;

    /* ================= DATA ================= */

    const dataSql = `
      SELECT
        r.room_id,
        r.room_no,
        r.room_name,
        r.building_name,
        r.residence_type,
        r.room_type,
        r.room_category,
        r.room_capacity,
        r.status,

        g.guest_id,
        g.guest_name,
        gr.guest_room_id,
        gr.check_in_date,
        gr.check_out_date,

        gh.guest_hk_id,
        hk.hk_id,
        hk.hk_name,
        gh.task_date,
        gh.task_shift

      FROM m_rooms r
      LEFT JOIN t_guest_room gr
        ON gr.room_id = r.room_id AND gr.is_active = true
      LEFT JOIN m_guest g
        ON g.guest_id = gr.guest_id
      LEFT JOIN t_room_housekeeping gh
        ON gh.room_id = r.room_id
      AND gh.is_active = true
      AND gh.status != 'Cancelled'
      LEFT JOIN m_housekeeping hk
        ON hk.hk_id = gh.hk_id

      WHERE r.is_active = true
      ${whereSql}
      ORDER BY ${sortColumn} ${order}
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    const dataParams = [...params, limit, offset];

    /* ================= EXEC ================= */

    const [{ count }] = (await this.db.query(countSql, params)).rows;
    const statsRow = (await this.db.query(statsSql, params)).rows[0];
    const { rows } = await this.db.query(dataSql, dataParams);

    /* ================= MAP ================= */

    return {
      data: rows.map((r) => ({
        roomId: r.room_id,
        roomNo: r.room_no,
        roomName: r.room_name,
        buildingName: r.building_name,
        residenceType: r.residence_type,
        roomType: r.room_type,
        roomCategory: r.room_category,
        roomCapacity: r.room_capacity,
        status: r.status,

        guest: r.guest_id
          ? {
              guestId: r.guest_id,
              guestName: r.guest_name,
              guestRoomId: r.guest_room_id,
              checkInDate: r.check_in_date,
              checkOutDate: r.check_out_date,
            }
          : null,

        housekeeping: r.guest_hk_id
          ? {
              guestHkId: r.guest_hk_id,
              hkId: r.hk_id,
              hkName: r.hk_name,
              taskDate: r.task_date,
              taskShift: r.task_shift,
              isActive: true,
            }
          : null,
      })),

      totalCount: count,
      stats: {
        total: Number(statsRow.total),
        available: Number(statsRow.available),
        occupied: Number(statsRow.occupied),
        withGuest: Number(statsRow.with_guest),
        withHousekeeping: Number(statsRow.with_housekeeping),
      },
    };
  }

  /* ================= FULL UPDATE ================= */

  async updateFullRoom(
    room_id: string,
    dto: EditRoomFullDto,
    user: string,
    ip: string
  ) {
    await this.db.query('BEGIN');

    try {
      /* ---------- 1️⃣ ROOM ---------- */

      await this.db.query(
        `
        UPDATE m_rooms SET
          room_no = COALESCE($1, room_no),
          room_name = COALESCE($2, room_name),
          building_name = COALESCE($3, building_name),
          residence_type = COALESCE($4, residence_type),
          room_type = COALESCE($5, room_type),
          room_capacity = COALESCE($6, room_capacity),
          room_category = COALESCE($7, room_category),
          status = COALESCE($8, status),
          updated_at = NOW(),
          updated_by = $9,
          updated_ip = $10
        WHERE room_id = $11
        `,
        [
          dto.room_no,
          dto.room_name,
          dto.building_name,
          dto.residence_type,
          dto.room_type,
          dto.room_capacity,
          dto.room_category,
          dto.status,
          user,
          ip,
          room_id,
        ]
      );

      /* ---------- 2️⃣ GUEST ---------- */

      if (dto.guest_id !== undefined) {
        // close active guest-room
        await this.db.query(
          `
          UPDATE t_guest_room
          SET is_active = FALSE,
              check_out_date = CURRENT_DATE,
              updated_at = NOW(),
              updated_by = $2,
              updated_ip = $3
          WHERE room_id = $1
            AND is_active = TRUE
          `,
          [room_id, user, ip]
        );

        if (dto.guest_id !== null) {
          const grIdRes = await this.db.query(`
            SELECT 'GR' || LPAD(
              (COALESCE(MAX(SUBSTRING(guest_room_id FROM 3)::int), 0) + 1)::text,
              3,
              '0'
            ) AS id
            FROM t_guest_room
          `);

          await this.db.query(
            `
            INSERT INTO t_guest_room (
              guest_room_id,
              guest_id,
              room_id,
              check_in_date,
              action_type,
              action_description,
              remarks,
              is_active,
              inserted_at,
              inserted_by,
              inserted_ip
            ) VALUES (
              $1,$2,$3,
              COALESCE($4, CURRENT_DATE),
              $5,$6,$7,
              TRUE,
              NOW(),$8,$9
            )
            `,
            [
              grIdRes.rows[0].id,
              dto.guest_id,
              room_id,
              dto.action_date ?? null,
              dto.action_type,
              dto.action_description ?? null,
              dto.remarks ?? null,
              user,
              ip,
            ]
          );

          await this.db.query(
            `UPDATE m_rooms SET status = 'Occupied' WHERE room_id = $1`,
            [room_id]
          );
        }
      }

      /* ---------- 3️⃣ HOUSEKEEPING ---------- */

      if (dto.hk_id !== undefined) {
        await this.db.query(
          `
          UPDATE t_room_housekeeping
          SET status = 'Cancelled',
              is_active = FALSE,
              completed_at = NOW()
          WHERE room_id = $1
            AND is_active = TRUE
          `,
          [room_id]
        );

        if (dto.hk_id !== null) {
          const hkIdRes = await this.db.query(`
            SELECT 'RHK' || LPAD(
              (COALESCE(MAX(SUBSTRING(guest_hk_id FROM 4)::int), 0) + 1)::text,
              3,
              '0'
            ) AS id
            FROM t_room_housekeeping
          `);

          await this.db.query(
            `
            INSERT INTO t_room_housekeeping (
              guest_hk_id,
              hk_id,
              room_id,
              task_date,
              task_shift,
              service_type,
              admin_instructions,
              status,
              assigned_by,
              assigned_at,
              is_active
            ) VALUES (
              $1,$2,$3,
              COALESCE($4, CURRENT_DATE),
              $5,$6,$7,
              'Scheduled',
              $8,NOW(),
              TRUE
            )
            `,
            [
              hkIdRes.rows[0].id,
              dto.hk_id,
              room_id,
              dto.task_date ?? null,
              dto.task_shift,
              dto.service_type,
              dto.admin_instructions ?? null,
              user,
            ]
          );
        }
      }

      await this.db.query('COMMIT');
      return { success: true };

    } catch (err) {
      await this.db.query('ROLLBACK');
      throw err;
    }
  }
  async findCheckedInGuestsWithoutRoom() {
    const sql = `
      SELECT
        io.guest_id,
        g.guest_name,
        io.entry_date,
        io.exit_date
      FROM t_guest_inout io
      JOIN m_guest g ON g.guest_id = io.guest_id
      LEFT JOIN t_guest_room gr
        ON gr.guest_id = io.guest_id
      AND gr.is_active = TRUE
      WHERE io.is_active = TRUE
        AND gr.guest_room_id IS NULL
      ORDER BY g.guest_name;
    `;

    const res = await this.db.query(sql);
    return res.rows;
  }
}
