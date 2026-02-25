import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateGuestRoomDto } from "./dto/create-guest-room.dto";
import { UpdateGuestRoomDto } from "./dto/update-guest-room.dto";
import { ActivityLogService } from "src/activity-log/activity-log.service";
@Injectable()
export class GuestRoomService {
  constructor(private readonly db: DatabaseService, private readonly activityLog: ActivityLogService) {}

  private async generateId(client: any): Promise<string> {
    const res = await client.query(`
      SELECT 'GR' || LPAD(nextval('guest_room_seq')::text, 3, '0') AS id
    `);
    return res.rows[0].id;
  }
  //Guest Management page - table view(guests, rooms)
  async getRoomOverview() {
    // 1️⃣ Close guest-room rows for exited / cancelled guests
    return this.db.transaction(async (client) => {

      try {
      await client.query(`
        UPDATE t_guest_room gr
        SET
          is_active = FALSE,
          check_out_date = COALESCE(gr.check_out_date, CURRENT_DATE),
          action_type = 'Room-Released',
          action_description = 'Auto-release on guest exit',
        FROM t_guest_inout io
        WHERE
          gr.guest_id = io.guest_id
          AND gr.is_active = TRUE
          AND io.is_active = FALSE
          AND io.status IN ('Exited', 'Cancelled')
      `);

      // 2️⃣ ALWAYS resync room status
      await client.query(`
        UPDATE m_rooms r
        SET status = 'Available'
        WHERE r.status = 'Occupied'
          AND NOT EXISTS (
            SELECT 1
            FROM t_guest_room gr
            WHERE gr.room_id = r.room_id
              AND gr.is_active = TRUE
          )
      `);

      // 2️⃣ Fetch room state snapshot
      const sql = `
        SELECT
          r.room_id,
          r.room_no,
          r.room_name,
          r.building_name,
          r.residence_type,
          r.room_capacity,
          r.room_type,
          r.room_category,
          r.status AS room_status,

          gr.guest_room_id,
          gr.check_in_date::text  AS check_in_date,
          gr.check_out_date::text AS check_out_date,
          gr.action_type,
          gr.action_description,
          gr.remarks,

          g.guest_id,
          g.guest_name,
          g.guest_name_local_language,

          md.designation_name,
          md.designation_name_local_language,
          gd.department,
          gd.organization,
          gd.is_current

        FROM m_rooms r

        LEFT JOIN t_guest_room gr
          ON gr.room_id = r.room_id
        AND gr.is_active = TRUE
        AND gr.check_out_date IS NULL

        LEFT JOIN m_guest g
          ON g.guest_id = gr.guest_id
        AND g.is_active = TRUE

        LEFT JOIN t_guest_designation gd
          ON gd.guest_id = g.guest_id
        AND gd.is_current = TRUE
        AND gd.is_active = TRUE

        LEFT JOIN m_guest_designation md
          ON md.designation_id = gd.designation_id
        AND md.is_active = TRUE

        WHERE r.is_active = TRUE
        ORDER BY r.room_no;
      `;
      const res = await client.query(sql);
      return res.rows;
      } catch (err) {
        throw err;
      }
    });
  }
  async activeGuestsDropDown() {
    const sql = `
      SELECT
        io.guest_id,
        g.guest_name,
        md.designation_name
      FROM t_guest_inout io
      JOIN m_guest g 
        ON g.guest_id = io.guest_id
      LEFT JOIN t_guest_designation gd
        ON gd.guest_id = g.guest_id
        AND gd.is_current = TRUE
        AND gd.is_active = TRUE
      LEFT JOIN m_guest_designation md
        ON md.designation_id = gd.designation_id
        AND md.is_active = TRUE
      WHERE io.is_active = TRUE
      ORDER BY g.guest_name;
    `;
    const res = await this.db.query(sql);
    return res.rows;
  }

  //Guest Management page - vacate
  async vacate(guestRoomId: string, user: string, ip: string, client?: any) {
    const executor = async (trx: any) => {
      if (!/^GR\d+$/.test(guestRoomId)) {
        throw new BadRequestException('Invalid Guest Room ID');
      }
      try {
        // 1️⃣ Fetch active stay
        const res = await trx.query(`
          SELECT room_id
          FROM t_guest_room
          WHERE guest_room_id = $1
            AND is_active = TRUE
          FOR UPDATE
        `, [guestRoomId]);

        if (!res.rowCount) {
          throw new NotFoundException('No active room assignment found');
        }

        const roomId = res.rows[0].room_id;
        await trx.query(`
          SELECT 1 FROM m_rooms
          WHERE room_id = $1
          FOR UPDATE
        `, [roomId]);

        // 2️⃣ Close stay
        await trx.query(`
          UPDATE t_guest_room
          SET is_active = FALSE,
              check_out_date = CURRENT_DATE,
              updated_at = NOW(),
              updated_by = $2,
              updated_ip = $3
          WHERE guest_room_id = $1
        `, [guestRoomId, user, ip]);

        // 3️⃣ Make room available
        await trx.query(`
          UPDATE m_rooms
          SET status = 'Available'
          WHERE room_id = $1
        `, [roomId]);
        // await trx.query(
        //   `
        //   UPDATE t_guest_hk
        //   SET status = 'Unassigned',
        //       is_active = FALSE
        //   WHERE guest_id = $1
        //     AND is_active = TRUE
        //   `,
        //   [guestId]
        // );
        await this.activityLog.log({
          message: 'Room unassigned to guest',
          module: 'GUEST ROOM',
          action: 'UNASSIGN',
          referenceId: guestRoomId,
          performedBy: user,
          ipAddress: ip,
        }, client);
        return { success: true };

      } catch (err) {
        throw err;
      }
    };
    if (client) {
      return executor(client);
    }
    return this.db.transaction(async (trx) => executor(trx));
  }

  async findAll(activeOnly = true) {
    if (typeof activeOnly !== 'boolean') {
      throw new BadRequestException('Invalid active flag');
    }
    const sql = activeOnly
      ? `SELECT * FROM t_guest_room WHERE is_active = $1 ORDER BY action_date DESC, action_time DESC`
      : `SELECT * FROM t_guest_room ORDER BY action_date DESC, action_time DESC`;
    const res = await this.db.query(sql, activeOnly ? [true] : []);
    if(!res.rows.length){
      throw new NotFoundException('No guest room entries found');
    }
    return res.rows;
  }

  async findOne(id: string) {
    if (!/^GR\d+$/.test(id)) {
      throw new BadRequestException('Invalid Guest Room ID');
    }
    const sql = `SELECT * FROM t_guest_room WHERE guest_room_id = $1`;
    const res = await this.db.query(sql, [id]);
    return res.rows[0];
  }

  async create(dto: CreateGuestRoomDto, user: string, ip: string, client?: any) {
    const executor = async (trx: any) => {
      // await this.db.query(`LOCK TABLE t_guest_room IN EXCLUSIVE MODE`);
      try {
        if (!/^G\d+$/.test(dto.guest_id)) {
          throw new BadRequestException('Invalid Guest ID');
        }
        // if (!/^R\d+$/.test(dto.room_id)) {
        //   throw new BadRequestException('INVALID_ROOM_ID');
        // }
        if (!dto.check_in_date || isNaN(Date.parse(dto.check_in_date))) {
          throw new BadRequestException('Invalid Check-in Date');
        }
        if (dto.check_out_date && isNaN(Date.parse(dto.check_out_date))) {
          throw new BadRequestException('Invalid Check-out Date');
        }
        if (dto.check_out_date && 
            new Date(dto.check_out_date) < new Date(dto.check_in_date)) {
          throw new BadRequestException('Check-out Date cannot be before Check-in Date');
        }
        const today = new Date();
        today.setHours(0,0,0,0);
        if (new Date(dto.check_in_date) < today) {
          throw new BadRequestException('Check-in Date cannot be in the past');
        }
        if (dto.remarks && dto.remarks.length > 500) {
          throw new BadRequestException('Remarks too long');
        }

        const roomRes = await trx.query(
          `
          SELECT room_capacity, status, is_active
          FROM m_rooms
          WHERE room_id = $1
          AND is_active = TRUE
          FOR UPDATE
          `,
          [dto.room_id]
        );
        if (!roomRes.rowCount) {
          throw new BadRequestException('Room not found');
        }
        const room = roomRes.rows[0];
        const duplicateCheck = await trx.query(`
          SELECT 1
          FROM t_guest_room
          WHERE guest_id = $1
            AND room_id = $2
            AND is_active = TRUE
          FOR UPDATE
        `, [dto.guest_id, dto.room_id]);

        if (duplicateCheck.rowCount > 0) {
          throw new BadRequestException(
            'Guest is already allocated to this room'
          );
        }

        const occupancyRes = await trx.query(
          `
          SELECT COUNT(*)::int AS count
          FROM t_guest_room
          WHERE room_id = $1
            AND is_active = TRUE
          `,
          [dto.room_id]
        );

        // 🔒 Lock active inout with companions
        const inoutRes = await trx.query(`
          SELECT inout_id, rooms_required, companions
          FROM t_guest_inout
          WHERE guest_id = $1
            AND is_active = TRUE
          FOR UPDATE
        `, [dto.guest_id]);

        if (!inoutRes.rowCount) {
          throw new BadRequestException('Guest has no active visit');
        }

        const {
          rooms_required,
          companions
        } = inoutRes.rows[0];
        const totalPeople = 1 + (companions ?? 0);

        // 🔒 Fetch already allocated rooms with capacity
        const allocatedRoomsRes = await trx.query(`
          SELECT r.room_capacity
          FROM t_guest_room gr
          JOIN m_rooms r ON r.room_id = gr.room_id
          WHERE gr.guest_id = $1
            AND gr.is_active = TRUE
          FOR UPDATE
        `, [dto.guest_id]);

        const currentRoomCount = allocatedRoomsRes.rowCount;

        const currentTotalCapacity = allocatedRoomsRes.rows.reduce(
          (sum, r) => sum + Number(r.room_capacity),
          0
        );
        const newRoomCount = currentRoomCount + 1;
        const newTotalCapacity = currentTotalCapacity + Number(room.room_capacity);
        // 🚨 Rule 1: Never exceed rooms_required
        if (newRoomCount > rooms_required) {
          throw new BadRequestException(
            `Guest cannot be allocated more than ${rooms_required} rooms`
          );
        }
        // 🚨 Rule 2: If this is the FINAL required room,
        // total capacity must satisfy total people
        if (
          newRoomCount === rooms_required &&
          newTotalCapacity < totalPeople
        ) {
          throw new BadRequestException(
            `Total room capacity (${newTotalCapacity}) is insufficient for ${totalPeople} people`
          );
        }
        if (occupancyRes.rows[0].count >= room.room_capacity) {
          throw new BadRequestException('Room has reached maximum capacity');
        }

        if (!room.is_active) {
          throw new BadRequestException('Cannot assign guest to inactive room');
        }

        if (room.status !== 'Available') {
          throw new BadRequestException('Room is not available');
        }

        // const capacityRes = await this.db.query(
        //   `
        //   SELECT room_capacity
        //   FROM m_rooms
        //   WHERE room_id = $1
        //   `,
        //   [dto.room_id]
        // );

        // if (occupancyRes.rows[0].count >= capacityRes.rows[0].room_capacity) {
        //   throw new BadRequestException('Room has reached maximum capacity');
        // }

        
        // 1️⃣ Ensure guest is active (from t_guest_inout)
        // const guestCheck = await trx.query(`
        //   SELECT 1 FROM t_guest_inout
        //   WHERE guest_id = $1 AND is_active = TRUE
        //   FOR UPDATE
        // `, [dto.guest_id]);

        // if (!guestCheck.rowCount) {
        //   throw new BadRequestException('Guest is not currently active');
        // }

        // 2️⃣ Ensure room is available

        // const roomCheck = await this.db.query(`
        //   SELECT status FROM m_rooms
        //   WHERE room_id = $1 AND is_active = TRUE
        // `, [dto.room_id]);

        // if (!roomCheck.rowCount) {
        //   throw new BadRequestException('Room not found or inactive');
        // }

        // if (roomCheck.rows[0].status !== 'Available' || occupancyRes.rows[0].count > 0) {
        //   throw new BadRequestException('Room is not available');
        // }

        const overlapCheck = await trx.query(
          `
          SELECT 1
          FROM t_guest_room
          WHERE room_id = $1
            AND is_active = TRUE
            AND daterange(
                  check_in_date,
                  COALESCE(check_out_date, check_in_date),
                  '[]'
                )
                && daterange($2, $3, '[]')
          LIMIT 1
          FOR UPDATE
          `,
          [
            dto.room_id,
            dto.check_in_date,
            dto.check_out_date ?? dto.check_in_date,
          ]
        );
        if (overlapCheck.rowCount > 0) {
          throw new BadRequestException(
            'Guest stay overlaps with an existing booking'
          );
        }
        
        // const roomActiveCheck = await this.db.query(
        //   `SELECT is_active FROM m_rooms WHERE room_id = $1`,
        //   [dto.room_id]
        // );

        // if (!roomActiveCheck.rows[0]?.is_active) {
        //   throw new BadRequestException('Cannot assign guest to inactive room');
        // }

        // 3️⃣ Generate guest_room_id
        const guestRoomId = await this.generateId(trx);

        // 4️⃣ Insert t_guest_room
        await trx.query(`
          INSERT INTO t_guest_room (
            guest_room_id,
            guest_id,
            room_id,
            check_in_date,
            check_out_date,
            action_type,
            action_description,
            remarks,
            is_active,
            inserted_at,
            inserted_by,
            inserted_ip
          ) VALUES (
            $1,$2,$3,$4,$5,
            'Room-Allocated',$6,$7,
            TRUE, NOW(), $8, $9
          )
        `, [
          guestRoomId,
          dto.guest_id,
          dto.room_id,
          dto.check_in_date,
          dto.check_out_date,
          dto.action_description,
          dto.remarks,
          user,
          ip
        ]);

        // 5️⃣ Update room status
        await trx.query(`
          UPDATE m_rooms SET status = 'Occupied'
          WHERE room_id = $1
        `, [dto.room_id]);
      await this.activityLog.log({
        message: 'Room assigned to guest',
        module: 'GUEST ROOM',
        action: 'ASSIGN',
        referenceId: guestRoomId,
        performedBy: user,
        ipAddress: ip,
      }, client);
        return { guest_room_id: guestRoomId };

      } catch (err) {
        // console.error("GuestRoom Create Error:", err);
        throw err;
      }
    };
    // 🔥 THIS PART IS THE MAGIC
    if (client) {
      return executor(client);
    }
    return this.db.transaction(async (trx) => executor(trx));
  }

  async update(id: string, dto: UpdateGuestRoomDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      if (!/^GR\d+$/.test(id)) {
        throw new BadRequestException('Invalid Guest Room ID');
      }
      try {
        const existingRes = await client.query(`
          SELECT *
          FROM t_guest_room
          WHERE guest_room_id = $1
          AND is_active = TRUE
          FOR UPDATE
        `, [id]);

        if (!existingRes.rowCount) {
          throw new NotFoundException(`Guest Room entry '${id}' not found`);
        }
        const existing = existingRes.rows[0];
        if (dto.check_in_date && isNaN(Date.parse(dto.check_in_date))) {
          throw new BadRequestException('Invalid check-in date');
        }
        if (dto.check_out_date && isNaN(Date.parse(dto.check_out_date))) {
          throw new BadRequestException('Invalid check-out date');
        }
        if (dto.check_in_date && dto.check_out_date &&
            new Date(dto.check_out_date) < new Date(dto.check_in_date)) {
          throw new BadRequestException('Check-out date must be after check-in date');
        }
        if (existing.is_active && dto.check_in_date &&
            dto.check_in_date !== existing.check_in_date) {
          throw new BadRequestException(
            'Cannot modify check-in date of active stay'
          );
        }
      if (
        dto.room_id &&
        dto.room_id !== existing.room_id &&
        existing.is_active
      ) {
        throw new BadRequestException(
          'Active guest cannot be moved to another room'
        );
      }
        await client.query(`
          SELECT 1 FROM m_rooms
          WHERE room_id = $1
          FOR UPDATE
        `, [existing.room_id]);

        // 🔴 If guest is being released
        if (dto.is_active === false || dto.action_type === 'Room-Released') {
          await client.query(`
            UPDATE t_guest_room
            SET is_active = FALSE,
                check_out_date = CURRENT_DATE,
                updated_at = NOW(),
                updated_by = $2,
                updated_ip = $3
            WHERE guest_room_id = $1
          `, [id, user, ip]);

          // 🔑 FREE THE ROOM
          await client.query(`
            UPDATE m_rooms
            SET status = 'Available'
            WHERE room_id = $1
          `, [existing.room_id]);

          return { success: true };
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
            updated_at = NOW(),
            updated_by = $12,
            updated_ip = $13
          WHERE guest_room_id = $14
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
          user,
          ip,
          id,
        ];
        const res = await client.query(sql, params);
      await this.activityLog.log({
        message: 'Room assigned to guest updated',
        module: 'GUEST ROOM',
        action: 'UPDATE',
        referenceId: id,
        performedBy: user,
        ipAddress: ip,
      }, client);
        return res.rows[0];
      } catch (err) {
        throw err;
      }
    });
  }

  async softDelete(id: string, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      if (!/^GR\d+$/.test(id)) {
        throw new BadRequestException('Invalid Guest Room ID');
      }
      const existing = await client.query(
        `SELECT 1 FROM t_guest_room WHERE guest_room_id = $1 FOR UPDATE`,
        [id]
      );

      if (!existing.rowCount) {
        throw new NotFoundException('Guest Room not found');
      }
      const sql = `
        UPDATE t_guest_room SET
          is_active = false,
          updated_at = NOW(),
          updated_by = $1,
          updated_ip = $2
        WHERE guest_room_id = $3
        RETURNING *;
      `;
      const res = await client.query(sql, [user, ip, id]);
      await this.activityLog.log({
        message: 'Room unassigned to guest',
        module: 'GUEST ROOM',
        action: 'UNASSIGN',
        referenceId: id,
        performedBy: user,
        ipAddress: ip,
      }, client);
      return res.rows[0];
    });
  }
}
