import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EditRoomFullDto } from './dto/editFullRoom.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GuestRoomService } from 'src/guest-room/guest-room.service';
const SORT_MAP: Record<string, string> = {
  room_no: 'r.room_no',
  room_name: 'r.room_name',
  status: 'r.status',
  guest_name: 'g.guest_name',
  hk_name: 's.full_name',
};

@Injectable()
export class RoomManagementService {
  constructor(
    private readonly db: DatabaseService,
    private readonly guestRoomService: GuestRoomService
  ) { }

  /* ================= OVERVIEW ================= */
  async getOverview({
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    status,
    entryDateFrom,
    entryDateTo,
  }: {
    page: number;
    limit: number;
    search?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    status?: 'Available' | 'Occupied';
    entryDateFrom?: string;
    entryDateTo?: string;
  }) {
    const sortColumn = SORT_MAP[sortBy] ?? 'r.room_no';
    const order = sortOrder === 'desc' ? 'DESC' : 'ASC';
    const offset = (page - 1) * limit;
    if (entryDateFrom === '') entryDateFrom = undefined;
    if (entryDateTo === '') entryDateTo = undefined;
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
let dateJoinSql = '';
const dateParams: any[] = [];

if (entryDateFrom) {
  dateJoinSql += ` AND io.entry_date >= $${idx}`;
  dateParams.push(entryDateFrom);
  idx++;
}

if (entryDateTo) {
  dateJoinSql += ` AND io.entry_date < ($${idx}::date + INTERVAL '1 day')`;
  dateParams.push(entryDateTo);
  idx++;
}
    const whereSql = whereParts.length > 0 ? `AND ${whereParts.join(' AND ')}` : '';

    /* ================= COUNT ================= */
    const countSql = `
      SELECT COUNT(*)::int AS count
      FROM m_rooms r
      LEFT JOIN t_guest_room gr
        ON gr.room_id = r.room_id AND gr.is_active = true
      LEFT JOIN m_guest g
        ON g.guest_id = gr.guest_id
      LEFT JOIN t_guest_inout io
        ON io.guest_id = g.guest_id
        AND io.room_id = r.room_id
        AND io.is_active = true
        ${dateJoinSql}
      WHERE r.is_active = true
      ${whereSql}
    `;

    /* ================= STATS (filtered) ================= */
    const statsSql = `
      SELECT
        COUNT(*) AS total,

        COUNT(*) FILTER (
          WHERE r.status = 'Available'
        ) AS available,

        COUNT(*) FILTER (
          WHERE r.status = 'Occupied'
        ) AS occupied,

        COUNT(*) FILTER (
          WHERE EXISTS (
            SELECT 1
            FROM t_guest_room gr2
            WHERE gr2.room_id = r.room_id
            AND gr2.is_active = true
          )
        ) AS with_guest,

        COUNT(*) FILTER (
          WHERE EXISTS (
            SELECT 1
            FROM t_guest_room gr2
            JOIN t_guest_hk gh2
              ON gh2.guest_id = gr2.guest_id
              AND gh2.is_active = TRUE
            WHERE gr2.room_id = r.room_id
              AND gr2.is_active = TRUE
          )
        ) AS with_housekeeping

      FROM m_rooms r
      LEFT JOIN t_guest_room gr
        ON gr.room_id = r.room_id AND gr.is_active = true
      LEFT JOIN m_guest g
        ON g.guest_id = gr.guest_id
      LEFT JOIN t_guest_inout io
        ON io.guest_id = g.guest_id
        AND io.room_id = r.room_id
        AND io.is_active = true
        ${dateJoinSql}
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
        g.guest_name_local_language,

        md.designation_name,
        gd.department,

        gr.guest_room_id,
        gr.check_in_date,
        gr.check_out_date,
        gr.action_type,
        gr.action_description,
        gr.remarks,

        io.entry_date,
        io.exit_date,

        gh.guest_hk_id,
        hk.hk_id,
        s.full_name,
        s.full_name_local_language,
        hk.shift,
        gh.remarks,
        gh.status AS hk_status,
        io.status AS io_status
      FROM m_rooms r

      LEFT JOIN t_guest_room gr
        ON gr.room_id = r.room_id
      AND gr.is_active = true

      LEFT JOIN m_guest g
        ON g.guest_id = gr.guest_id
      AND g.is_active = true

      LEFT JOIN t_guest_designation gd
        ON gd.guest_id = g.guest_id
      AND gd.is_current = true
      AND gd.is_active = true

      LEFT JOIN m_guest_designation md
        ON md.designation_id = gd.designation_id
      AND md.is_active = true

      LEFT JOIN t_guest_inout io
        ON io.guest_id = g.guest_id
      AND io.room_id = r.room_id
      AND io.is_active = true
      ${dateJoinSql}

    LEFT JOIN t_guest_hk gh
      ON gh.guest_id = g.guest_id
      AND gh.is_active = TRUE

    LEFT JOIN m_housekeeping hk
      ON hk.hk_id = gh.hk_id
      AND hk.is_active = TRUE

    LEFT JOIN m_staff s
      ON s.staff_id = hk.staff_id
      AND s.is_active = TRUE

      WHERE r.is_active = true
      ${whereSql}
      ORDER BY ${sortColumn} ${order}
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    const finalParams = [...params, ...dateParams];
    const dataParams = [...finalParams, limit, offset];
    // if (entryDateFrom) dataParams.push(entryDateFrom);
    // if (entryDateTo) dataParams.push(entryDateTo);
    /* ================= EXEC ================= */

    const [{ count }] = (await this.db.query(countSql, finalParams)).rows;
    const statsRow = (await this.db.query(statsSql, finalParams)).rows[0];
    const { rows } = await this.db.query(dataSql, dataParams);

    /* ================= MAP ================= */
    return {
      data: rows.map((r) => ({
        roomId: r.room_id,
        roomNo: r.room_no,
        roomName: r.room_name,
        roomType: r.room_type,
        buildingName: r.building_name,
        residenceType: r.residence_type,
        roomCategory: r.room_category,
        roomCapacity: r.room_capacity,
        status: r.status,

        guest: r.guest_id
          ? {
              guestId: r.guest_id,
              guestName: r.guest_name,
              guestNameLocalLanguage: r.guest_name_local_language,

              designation: r.designation_name
                ? {
                    name: r.designation_name,
                    department: r.department,
                  }
                : null,

              guestRoomId: r.guest_room_id,
              checkInDate: r.check_in_date,
              checkOutDate: r.check_out_date,

              entryDate: r.entry_date,
              exitDate: r.exit_date,
            }
          : null,

        housekeeping: r.guest_hk_id
          ? {
              guestHkId: r.guest_hk_id,
              hkId: r.hk_id,
              hkName: r.full_name,
              remarks: r.remarks,
              status: r.status,
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
    return this.db.transaction(async (client) => {
      try {

        const roomRes = await client.query(
          `SELECT * FROM m_rooms WHERE room_id = $1 AND is_active = TRUE FOR UPDATE`,
          [room_id]
        );

        if (!roomRes.rowCount) {
          throw new NotFoundException(`Room '${room_id}' not found`);
        }

        const room = roomRes.rows[0];
        const activeGuestRes = await client.query(
          `
        SELECT guest_room_id
        FROM t_guest_room
        WHERE room_id = $1
          AND is_active = TRUE
        FOR UPDATE
        `,
          [room_id]
        );

        const activeGuestCount = activeGuestRes.rowCount;
        // const activeGuestCount = activeGuestRes.rows[0].count;
        /* ================= VALIDATIONS ================= */
        // 1️⃣ Capacity must always be >= 1
        if (
          dto.room_capacity !== undefined &&
          activeGuestCount > 0 &&
          dto.room_capacity < room.room_capacity
        ) {
          throw new BadRequestException(
            'Room capacity must be at least 1'
          );
        }

        // 2️⃣ If room has active guest, restrict critical changes
        if (activeGuestCount > 0) {
          if (dto.room_no && dto.room_no !== room.room_no) {
            throw new BadRequestException(
              'Room number cannot be changed while room is occupied'
            );
          }

          if (dto.room_type && dto.room_type !== room.room_type) {
            throw new BadRequestException(
              'Room type cannot be changed while room is occupied'
            );
          }

          if (
            dto.room_capacity !== undefined &&
            dto.room_capacity < activeGuestCount
          ) {
            throw new BadRequestException(
              `Room capacity cannot be less than current occupancy (${activeGuestCount})`
            );
          }

          if (dto.status === 'Available') {
            throw new BadRequestException(
              'Occupied room cannot be marked as Available'
            );
          }
        }
        /* ---------- GUEST VALIDATION ---------- */

        if (dto.guest_id !== undefined) {

          // Assigning a new guest while one is already checked in
          if (dto.guest_id !== null && activeGuestCount > 0) {
            throw new BadRequestException(
              'Room already has an active guest'
            );
          }

          // Removing guest when no guest exists
          if (dto.guest_id === null && activeGuestCount === 0) {
            throw new BadRequestException(
              'No active guest to remove from this room'
            );
          }
        }

        /* ---------- HOUSEKEEPING VALIDATION ---------- */
        if (dto.hk_id !== undefined && dto.hk_id !== null) {

          if (!dto.task_shift) {
            throw new BadRequestException(
              'Task shift is required for housekeeping assignment'
            );
          }

          // Prevent same HK assigned to multiple rooms in same shift/date
          const hkConflict = await client.query(
            `
            SELECT 1
            FROM t_guest_hk
            WHERE hk_id = $1
              AND is_active = TRUE
            FOR UPDATE
            `,
            [dto.hk_id]
          );

          if (hkConflict.rowCount > 0) {
            throw new BadRequestException(
              'Housekeeping staff already assigned to another room for this shift'
            );
          }

          // Task date must not be in the past
          if (dto.task_date) {
            const taskDate = new Date(dto.task_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (taskDate < today) {
              throw new BadRequestException(
                'Housekeeping task date cannot be in the past'
              );
            }
          }
        }
        /* ---------- 1️⃣ ROOM ---------- */

        await client.query(
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

          // 1️⃣ Close active guest-room (checkout)
          await client.query(
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

          // 2️⃣ If removing guest → mark room Available
          if (dto.guest_id === null) {
            await client.query(
              `UPDATE m_rooms SET status = 'Available' WHERE room_id = $1`,
              [room_id]
            );
          }

          // 3️⃣ If assigning new guest → insert + mark Occupied
          if (dto.guest_id !== undefined) {
            if (dto.guest_id === null) {
              await this.guestRoomService.vacate(
                room_id,
                user,
                ip,
                client
              );
            }
            if (dto.guest_id !== null) {
              await this.guestRoomService.create(
                {
                  guest_id: dto.guest_id,
                  room_id: room_id,
                  check_in_date: dto.action_date ?? undefined,
                  action_type: dto.action_type ?? 'Room-Allocated',
                  action_description: dto.action_description,
                },
                user,
                ip,
                client
              );
            }
          }

          // if (dto.guest_id !== null) {
          //   const grIdRes = await client.query(`
          //     SELECT 'GR' || LPAD(nextval('guest_room_seq')::text, 3, '0') AS id;
          //   `);

          //   await client.query(
          //     `
          //     INSERT INTO t_guest_room (
          //       guest_room_id,
          //       guest_id,
          //       room_id,
          //       check_in_date,
          //       action_type,
          //       action_description,
          //       remarks,
          //       is_active,
          //       inserted_at,
          //       inserted_by,
          //       inserted_ip
          //     ) VALUES (
          //       $1,$2,$3,
          //       COALESCE($4, CURRENT_DATE),
          //       $5,$6,$7,
          //       TRUE,
          //       NOW(),$8,$9
          //     )
          //     `,
          //     [
          //       grIdRes.rows[0].id,
          //       dto.guest_id,
          //       room_id,
          //       dto.action_date ?? null,
          //       dto.action_type,
          //       dto.action_description ?? null,
          //       dto.remarks ?? null,
          //       user,
          //       ip,
          //     ]
          //   );

          //   await client.query(
          //     `UPDATE m_rooms SET status = 'Occupied' WHERE room_id = $1`,
          //     [room_id]
          //   );
          // }
        }

        /* ---------- 3️⃣ HOUSEKEEPING ---------- */
        if (dto.hk_id !== undefined) {

          // Get active guest for this room
          const guestRes = await client.query(
            `
            SELECT guest_id
            FROM t_guest_room
            WHERE room_id = $1
              AND is_active = TRUE
            FOR UPDATE
            `,
            [room_id]
          );

          if (!guestRes.rowCount) {
            throw new BadRequestException(
              'Cannot assign housekeeping without active guest'
            );
          }

          const guestId = guestRes.rows[0].guest_id;

          // Cancel existing assignment
          await client.query(
            `
            UPDATE t_guest_hk
            SET status = 'Cancelled',
                is_active = FALSE,
                updated_at = NOW(),
                updated_by = $2,
                updated_ip = $3
            WHERE guest_id = $1
              AND is_active = TRUE
            `,
            [guestId, user, ip]
          );

          // Assign new housekeeping
          if (dto.hk_id !== null) {

            const hkIdRes = await client.query(`
              SELECT 'GHK' || LPAD(nextval('guest_housekeeping_seq')::text, 3, '0') AS id;
            `);

            await client.query(
              `
              INSERT INTO t_guest_hk (
                guest_hk_id,
                guest_id,
                hk_id,
                status,
                remarks,
                is_active,
                inserted_at,
                inserted_by,
                inserted_ip
              )
              VALUES (
                $1,$2,$3,
                'Assigned',
                $4,
                TRUE,
                NOW(),$5,$6
              )
              `,
              [
                hkIdRes.rows[0].id,
                guestId,
                dto.hk_id,
                dto.remarks ?? null,
                user,
                ip,
              ]
            );
          }
        }
        return { success: true };

      } catch (err) {

        throw err;
      }
    });
  }
  // async findCheckedInGuestsWithoutRoom() {
  //   const sql = `
  //     SELECT
  //       io.guest_id,
  //       g.guest_name,
  //       io.entry_date,
  //       io.exit_date
  //     FROM t_guest_inout io
  //     JOIN m_guest g ON g.guest_id = io.guest_id
  //     LEFT JOIN t_guest_room gr
  //       ON gr.guest_id = io.guest_id
  //     AND gr.is_active = TRUE
  //     WHERE io.is_active = TRUE
  //       AND gr.guest_room_id IS NULL
  //     ORDER BY g.guest_name;
  //   `;

  //   const res = await client.query(sql);
  //   return res.rows;
  // }
  async findCheckedInGuestsWithoutRoom() {
    // const sql = `
    //   SELECT DISTINCT ON (io.guest_id)
    //     io.guest_id,
    //     g.guest_name,
    //     io.entry_date,
    //     io.exit_date
    //   FROM t_guest_inout io
    //   JOIN m_guest g
    //     ON g.guest_id = io.guest_id
    //   AND g.is_active = TRUE

    //   LEFT JOIN t_guest_room gr
    //     ON gr.guest_id = io.guest_id
    //   AND gr.is_active = TRUE

    //   WHERE io.is_active = TRUE
    //     AND gr.guest_room_id IS NULL

    //     -- ✅ NEW CONSTRAINT
    //     AND io.entry_date IS NOT NULL
    //     AND (
    //       io.exit_date IS NULL
    //       OR io.exit_date >= CURRENT_DATE
    //     )

    //   ORDER BY io.guest_id, io.entry_date DESC;
    // `;
    const sql = `
      SELECT DISTINCT ON (io.guest_id)
        io.guest_id,
        g.guest_name,

        md.designation_name,
        gd.department,

        io.entry_date,
        io.exit_date

      FROM t_guest_inout io

      JOIN m_guest g
        ON g.guest_id = io.guest_id
      AND g.is_active = TRUE

      LEFT JOIN t_guest_designation gd
        ON gd.guest_id = io.guest_id
      AND gd.is_current = TRUE
      AND gd.is_active = TRUE

      LEFT JOIN m_guest_designation md
        ON md.designation_id = gd.designation_id
      AND md.is_active = TRUE

      LEFT JOIN t_guest_room gr
        ON gr.guest_id = io.guest_id
      AND gr.is_active = TRUE

      WHERE io.is_active = TRUE
        AND gr.guest_room_id IS NULL

        AND io.entry_date IS NULL
        AND (
          io.exit_date IS NULL
          OR io.exit_date >= CURRENT_DATE
        )

      ORDER BY io.guest_id, io.entry_date DESC;
    `;

    const res = await this.db.query(sql);
    return res.rows;
  }

}
