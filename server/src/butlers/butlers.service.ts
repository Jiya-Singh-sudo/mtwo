import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateButlerDto } from './dto/create-butler.dto';
import { UpdateButlerDto } from './dto/update-butler.dto';

@Injectable()
export class ButlersService {
  constructor(private readonly db: DatabaseService) {}
  private async generateButlerId(): Promise<string> {
    const sql = `
      SELECT butler_id
      FROM m_butler
      ORDER BY CAST(SUBSTRING(butler_id FROM 3) AS INTEGER) DESC
      LIMIT 1
    `;

    const result = await this.db.query(sql);

    if (result.rows.length === 0) {
      return 'B_001';
    }

    const lastId = result.rows[0].butler_id; // e.g. B_007
    const lastNumber = parseInt(lastId.replace('B_', ''), 10);
    const nextNumber = lastNumber + 1;

    return `B_${nextNumber.toString().padStart(3, '0')}`;
  }


  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `SELECT * FROM m_butler WHERE is_active = $1 ORDER BY butler_name`
      : `SELECT * FROM m_butler ORDER BY butler_name`;

    const result = await this.db.query(sql, activeOnly ? [true] : []);
    return result.rows;
  }

  async findOneById(id: string) {
    const sql = `SELECT * FROM m_butler WHERE butler_id = $1`;
    const result = await this.db.query(sql, [id]);
    return result.rows[0];
  }

  async create(dto: CreateButlerDto, user: string, ip: string) {
    const butlerId = await this.generateButlerId();
    const now = new Date()
      .toLocaleString('en-GB', { hour12: false, timeZone: 'Asia/Kolkata' })
      .replace(',', '');

    const sql = `
      INSERT INTO m_butler (
        butler_id,
        butler_name,
        butler_name_local_language,
        butler_mobile,
        butler_alternate_mobile,
        address,
        remarks,
        shift,
        is_active,
        inserted_at,
        inserted_by,
        inserted_ip,
        updated_at,
        updated_by,
        updated_ip
      )
      VALUES (
        $1,  -- butler_id
        $2,  -- butler_name
        $3,  -- butler_name_local_language
        $4,  -- butler_mobile
        $5,  -- butler_alternate_mobile
        $6,  -- address
        $7,  -- remarks
        $8,  -- shift
        true,
        $9,  -- inserted_at
        $10, -- inserted_by
        $11, -- inserted_ip
        NULL,
        NULL,
        NULL
      )
      RETURNING *`;

  const params = [
    butlerId,                        // $1
    dto.butler_name,                // $2
    dto.butler_name_local_language ?? null, // $3
    dto.butler_mobile,              // $4
    dto.butler_alternate_mobile ?? null, // $5
    dto.address ?? null,            // $6
    dto.remarks ?? null,            // $7
    dto.shift,                      // $8  ← THIS was missing
    now,                            // $9
    user,                           // $10
    ip                              // $11
  ];

    const res = await this.db.query(sql, params);
    return res.rows[0];
  }

  async update(id: string, dto: UpdateButlerDto, user: string, ip: string) {
    const existing = await this.findOneById(id);
    if (!existing) throw new Error(`Butler '${id}' not found`);

    const now = new Date()
      .toLocaleString('en-GB', { hour12: false, timeZone: 'Asia/Kolkata' })
      .replace(',', '');

    const sql = `
      UPDATE m_butler SET
        butler_name = $1,
        butler_name_local_language = $2,
        butler_mobile = $3,
        butler_alternate_mobile = $4,
        address = $5,
        remarks = $6,
        shift = $7,
        is_active = $8,
        updated_at = $9,
        updated_by = $10,
        updated_ip = $11
      WHERE butler_id = $12
      RETURNING *;
    `;

    const params = [
      dto.butler_name ?? existing.butler_name,
      dto.butler_name_local_language ?? existing.butler_name_local_language,
      dto.butler_mobile ?? existing.butler_mobile,
      dto.butler_alternate_mobile ?? existing.butler_alternate_mobile,
      dto.address ?? existing.address,
      dto.remarks ?? existing.remarks,
      dto.shift ?? existing.shift,
      dto.is_active ?? existing.is_active,
      now,
      user,
      ip,
      existing.butler_id,
    ];

    const res = await this.db.query(sql, params);
    return res.rows[0];
  }

  async softDelete(id: string, user: string, ip: string) {
    const existing = await this.findOneById(id);
    if (!existing) throw new Error(`Butler '${id}' not found`);

    const now = new Date().toISOString();

    const sql = `
      UPDATE m_butler SET
        is_active = false,
        updated_at = $1,
        updated_by = $2,
        updated_ip = $3
      WHERE butler_id = $4
      RETURNING *;
    `;

    const params = [now, user, ip, existing.butler_id];
    const res = await this.db.query(sql, params);
    return res.rows[0];
  }
}
