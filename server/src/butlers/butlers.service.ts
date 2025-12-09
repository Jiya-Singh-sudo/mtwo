import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateButlerDto } from './dto/create-butler.dto';
import { UpdateButlerDto } from './dto/update-butler.dto';

@Injectable()
export class ButlersService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `SELECT * FROM m_butler WHERE is_active = $1 ORDER BY butler_name`
      : `SELECT * FROM m_butler ORDER BY butler_name`;

    const result = await this.db.query(sql, activeOnly ? [true] : []);
    return result.rows;
  }

  async findOneByName(name: string) {
    const sql = `SELECT * FROM m_butler WHERE butler_name = $1`;
    const result = await this.db.query(sql, [name]);
    return result.rows[0];
  }

  async create(dto: CreateButlerDto, user: string, ip: string) {
    const now = new Date()
      .toLocaleString('en-GB', { hour12: false, timeZone: 'Asia/Kolkata' })
      .replace(',', '');

    const sql = `
      INSERT INTO m_butler (
        butler_name,
        butler_name_local_language,
        butler_mobile,
        butler_alternate_mobile,
        address,
        remarks,
        shift,
        is_active,
        inserted_at, inserted_by, inserted_ip,
        updated_at, updated_by, updated_ip
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8,$9,NULL,NULL,NULL)
      RETURNING *;
    `;

    const params = [
      dto.butler_name,
      dto.butler_name_local_language ?? null,
      dto.butler_mobile,
      dto.butler_alternate_mobile ?? null,
      dto.address ?? null,
      dto.remarks ?? null,
      dto.shift,
      now,
      user,
      ip,
    ];

    const res = await this.db.query(sql, params);
    return res.rows[0];
  }

  async update(name: string, dto: UpdateButlerDto, user: string, ip: string) {
    const existing = await this.findOneByName(name);
    if (!existing) throw new Error(`Butler '${name}' not found`);

    const now = new Date()
      .toLocaleString('en-GB', { hour12: false, timeZone: 'Asia/Kolkata' })
      .replace(',', '');

    const sql = `
      UPDATE m_butler SET
        butler_name = $1,
        butler_name_local_language = $2,
        mobile = $3,
        alternate_mobile = $4,
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

  async softDelete(name: string, user: string, ip: string) {
    const existing = await this.findOneByName(name);
    if (!existing) throw new Error(`Butler '${name}' not found`);

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
