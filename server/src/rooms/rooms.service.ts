import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateRoomDto } from './dto/create-rooms.dto';
import { UpdateRoomDto } from './dto/update-rooms.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly db: DatabaseService) {}

  private async generateRoomId(): Promise<string> {
    const result = await this.db.query(`
      SELECT room_id
      FROM m_rooms
      WHERE room_id ~ '^R[_]?[0-9]+$'
      ORDER BY
        CAST(REGEXP_REPLACE(room_id, '[^0-9]', '', 'g') AS INTEGER) DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return 'R_001';
    }

    const lastId = result.rows[0].room_id;

    // Extract ONLY digits, safely
    const numericPart = lastId.replace(/\D/g, '');
    const num = Number(numericPart);

    if (!Number.isFinite(num)) {
      throw new Error(`Corrupt room_id detected: ${lastId}`);
    }

    return `R_${String(num + 1).padStart(3, '0')}`;
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
    const now = new Date()
      .toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false })
      .replace(',', '');
    const roomId = await this.generateRoomId();

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
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,$10,$11,$12,NULL,NULL,NULL)
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
      now,
      user,
      ip,
    ];

    const result = await this.db.query(sql, params);
    return result.rows[0];
  }

  async update(room_id: string, dto: UpdateRoomDto, user: string, ip: string) {
    const existing = await this.findOneById(room_id);
    if (!existing) {
      throw new Error(`Room '${room_id}' not found`);
    }

    const now = new Date()
      .toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false })
      .replace(',', '');

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
        updated_at = $10,
        updated_by = $11,
        updated_ip = $12
      WHERE room_id = $13
      RETURNING *;
    `;

    const params = [
      dto.room_no ?? existing.room_no,
      dto.room_name ?? existing.room_name,
      dto.building_name ?? existing.building_name,
      dto.residence_type ?? existing.residence_type,
      dto.room_type ?? existing.room_type,
      dto.room_capacity ?? existing.room_capacity,
      dto.room_category ?? existing.room_category,
      dto.status ?? existing.status,
      dto.is_active ?? existing.is_active,
      now,
      user,
      ip,
      existing.room_id,
    ];

    const result = await this.db.query(sql, params);
    return result.rows[0];
  }

  // async softDelete(room_no: string, user: string, ip: string) {
  //   const existing = await this.findOneByRoomNo(room_no);
  //   if (!existing) {
  //     throw new Error(`Room '${room_no}' not found`);
  //   }

  //   const now = new Date().toISOString();

  //   const sql = `
  //     UPDATE m_rooms SET
  //       is_active = false,
  //       updated_at = $1,
  //       updated_by = $2,
  //       updated_ip = $3
  //     WHERE room_id = $4
  //     RETURNING *;
  //   `;

  //   const params = [now, user, ip, existing.room_id];
  //   const result = await this.db.query(sql, params);

  //   return result.rows[0];
  // }

  async softDelete(room_no: string, user: string, ip: string) {
    const existing = await this.findOneByRoomNo(room_no);
    if (!existing) {
      throw new Error(`Room '${room_no}' not found`);
    }

    // 1️⃣ Check active guest-room assignment
    const assigned = await this.db.query(
      `
      SELECT 1
      FROM t_guest_room
      WHERE room_id = $1
        AND is_active = TRUE
      LIMIT 1
      `,
      [existing.room_id]
    );

    if (assigned.rowCount > 0) {
      throw new Error(
        'Cannot delete room: room is currently assigned to a guest'
      );
    }

    // 2️⃣ Safe delete
    const now = new Date().toISOString();

    const sql = `
      UPDATE m_rooms SET
        is_active = FALSE,
        updated_at = $1,
        updated_by = $2,
        updated_ip = $3
      WHERE room_id = $4
      RETURNING *;
    `;

    const params = [now, user, ip, existing.room_id];
    const result = await this.db.query(sql, params);

    return result.rows[0];
  }
}
