import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateRoomDto } from './dto/create-rooms.dto';
import { UpdateRoomDto } from './dto/update-rooms.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@Injectable()
export class RoomsService {
  constructor(private readonly db: DatabaseService) {}

  private async getActiveGuestCount(room_id: string): Promise<number> {
    const result = await this.db.query(
      `
      SELECT COUNT(*)::int AS count
      FROM t_guest_room
      WHERE room_id = $1
        AND is_active = TRUE
      `,
      [room_id]
    );

    return result.rows[0]?.count ?? 0;
  }

  // private async generateRoomId(client: any): Promise<string> {
  //   const result = await client.query(`
  //     SELECT room_id
  //     FROM m_rooms
  //     WHERE room_id ~ '^R[_]?[0-9]+$'
  //     ORDER BY
  //       CAST(REGEXP_REPLACE(room_id, '[^0-9]', '', 'g') AS INTEGER) DESC
  //     LIMIT 1
  //   `);

  //   if (result.rows.length === 0) {
  //     return 'R_001';
  //   }

  //   const lastId = result.rows[0].room_id;

  //   // Extract ONLY digits, safely
  //   const numericPart = lastId.replace(/\D/g, '');
  //   const num = Number(numericPart);

  //   if (!Number.isFinite(num)) {
  //     throw new BadRequestException(`Corrupt room_id detected: ${lastId}`);
  //   }

  //   return `R_${String(num + 1).padStart(3, '0')}`;
  // }
  private async generateRoomId(client: any): Promise<string> {
    const res = await client.query(`
      SELECT 'R_' || LPAD(nextval('room_seq')::text, 3, '0') AS id
    `);
    return res.rows[0].id;
  }

  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `SELECT * FROM m_rooms WHERE is_active = $1 ORDER BY room_no`
      : `SELECT * FROM m_rooms ORDER BY room_no`;

    const result = await this.db.query(sql, activeOnly ? [true] : []);
    return result.rows;
  }

  async findOneByRoomNo(room_no: string) {
    const sql = `SELECT * FROM m_rooms WHERE room_no = $1`;
    const result = await this.db.query(sql, [room_no]);
    return result.rows[0];
  }

  async findOneById(room_id: string) {
    const sql = `SELECT * FROM m_rooms WHERE room_id = $1`;
    const result = await this.db.query(sql, [room_id]);
    return result.rows[0];
  }

  async create(dto: CreateRoomDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      try {
        await client.query(`
          SELECT 1
          FROM m_rooms
          WHERE room_no = $1
          FOR UPDATE
        `, [dto.room_no]);

        const existing = await client.query(
          `
          SELECT 1
          FROM m_rooms
          WHERE room_no = $1
            AND is_active = TRUE
          LIMIT 1
          `,
          [dto.room_no]
        );

        if (existing.rowCount > 0) {
          throw new BadRequestException(
            `Room number '${dto.room_no}' already exists`
          );
        }

        // const now = new Date()
        //   .toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false })
        //   .replace(',', '');
        const roomId = await this.generateRoomId(client);
        
        const sql = `
          INSERT INTO m_rooms (
            room_id,
            room_no,
            room_name,
            building_name,
            residence_type,
            room_type,
            room_capacity,
            room_category,
            status,
            is_active,
            inserted_at, inserted_by, inserted_ip,
            updated_at, updated_by, updated_ip
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,NOW(),$10,$11,NULL,NULL,NULL)
          RETURNING *;
        `;

        const params = [
          roomId,
          dto.room_no,
          dto.room_name ?? null,
          dto.building_name ?? null,
          dto.residence_type ?? null,
          dto.room_type ?? null,
          dto.room_capacity ?? null,
          dto.room_category ?? null,
          dto.status,
          user,
          ip,
        ];

        const result = await client.query(sql, params);
        return result.rows[0];
        } catch (err) {
        throw err;
      }
    });
  }

  async update(room_id: string, dto: UpdateRoomDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {

      const existingRes = await client.query(
        `SELECT * FROM m_rooms WHERE room_id = $1 FOR UPDATE`,
        [room_id]
      );

      if (!existingRes.rowCount) {
        throw new NotFoundException(`Room '${room_id}' not found`);
      }

      const existing = existingRes.rows[0];
      const activeGuestRes = await client.query(
        `
        SELECT 1
        FROM t_guest_room
        WHERE room_id = $1
          AND is_active = TRUE
        FOR UPDATE
        `,
        [room_id]
      );
      const activeGuestCount = activeGuestRes.rowCount;
      const nextRoomNo = dto.room_no ?? existing.room_no;
      const nextRoomType = dto.room_type ?? existing.room_type;
      const nextCapacity = dto.room_capacity ?? existing.room_capacity;
      const nextIsActive = dto.is_active ?? existing.is_active;
      if (dto.room_no && dto.room_no !== existing.room_no) {
        const duplicate = await client.query(
          `
          SELECT 1
          FROM m_rooms
          WHERE room_no = $1
            AND is_active = TRUE
            AND room_id <> $2
          LIMIT 1
          `,
          [dto.room_no, room_id]
        );

        if (duplicate.rowCount > 0) {
          throw new BadRequestException(
            `Room number '${dto.room_no}' already exists`
          );
        }
      }
      if (activeGuestCount > 0) {
        // 1️⃣ Room identity must remain stable
        if (nextRoomNo !== existing.room_no) {
          throw new BadRequestException(
            'Room number cannot be changed while the room is occupied'
          );
        }

        if (nextRoomType !== existing.room_type) {
          throw new BadRequestException(
            'Room type cannot be changed while the room is occupied'
          );
        }

        // 2️⃣ Capacity must not drop below current occupancy
        if (nextCapacity < activeGuestCount) {
          throw new BadRequestException(
            `Room capacity cannot be less than current occupancy (${activeGuestCount})`
          );
        }

        // 3️⃣ Occupied room cannot be deactivated
        if (nextIsActive === false) {
          throw new BadRequestException(
            'Occupied room cannot be deactivated'
          );
        }
      }

      const sql = `
        UPDATE m_rooms SET
          room_no = $1,
          room_name = $2,
          building_name = $3,
          residence_type = $4,
          room_type = $5,
          room_capacity = $6,
          room_category = $7,
          status = $8,
          is_active = $9,
          updated_at = NOW(),
          updated_by = $10,
          updated_ip = $11
        WHERE room_id = $12
        RETURNING *;
      `;

      const params = [
        nextRoomNo,
        dto.room_name ?? existing.room_name,
        dto.building_name ?? existing.building_name,
        dto.residence_type ?? existing.residence_type,
        nextRoomType,
        nextCapacity,
        dto.room_category ?? existing.room_category,
        dto.status ?? existing.status,
        nextIsActive,
        user,
        ip,
        room_id,
      ];

      const result = await client.query(sql, params);
      
      return result.rows[0];
    });
  }

  async softDelete(room_no: string, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      const existingRes = await client.query(
        `SELECT * FROM m_rooms WHERE room_no = $1 FOR UPDATE`,
        [room_no]
      );

      if (!existingRes.rowCount) {
        throw new NotFoundException(`Room '${room_no}' not found`);
      }
      const room = existingRes.rows[0];
      // 1️⃣ Check active guest occupancy
      const activeGuest = await client.query(
        `
        SELECT 1
        FROM t_guest_room
        WHERE room_id = $1
          AND is_active = TRUE
        LIMIT 1
        `,
        [room.room_id]
      );

      if (activeGuest.rowCount > 0) {
        throw new BadRequestException(
          'Cannot delete room: room is currently occupied by a guest'
        );
      }

      // 2️⃣ Check active room boy / housekeeping assignment
      const activeHousekeeping = await client.query(
        `
        SELECT 1
        FROM t_guest_hk
        WHERE room_id = $1
          AND is_active = TRUE
        LIMIT 1
        `,
        [room.room_id]
      );

      if (activeHousekeeping.rowCount > 0) {
        throw new BadRequestException(
          'Cannot delete room: room is currently assigned to housekeeping staff'
        );
      }

      // 3️⃣ Safe soft delete
      const sql = `
        UPDATE m_rooms SET
          is_active = FALSE,
          updated_at = NOW(),
          updated_by = $1,
          updated_ip = $2
        WHERE room_id = $3
        RETURNING *;
      `;

      const params = [user, ip, room.room_id];
      const result = await client.query(sql, params);

      return result.rows[0];
    });
  }
}
