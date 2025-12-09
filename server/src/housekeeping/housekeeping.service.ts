import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateHousekeepingDto } from './dto/create-housekeeping.dto';
import { UpdateHousekeepingDto } from './dto/update-housekeeping.dto';

@Injectable()
export class HousekeepingService {
  constructor(private readonly db: DatabaseService) {}

  private async generateId(): Promise<string> {
    const sql = `SELECT hk_id FROM m_housekeeping ORDER BY hk_id DESC LIMIT 1`;
    const res = await this.db.query(sql);

    if (res.rows.length === 0) return "HK001";

    const last = res.rows[0].hk_id.replace("HK", "");
    const next = (parseInt(last) + 1).toString().padStart(3, "0");
    return "HK" + next;
  }

  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `SELECT * FROM m_housekeeping WHERE is_active = $1 ORDER BY hk_name`
      : `SELECT * FROM m_housekeeping ORDER BY hk_name`;

    const res = await this.db.query(sql, activeOnly ? [true] : []);
    return res.rows;
  }

  async findOneByName(name: string) {
    const sql = `SELECT * FROM m_housekeeping WHERE hk_name = $1`;
    const res = await this.db.query(sql, [name]);
    return res.rows[0];
  }

  async create(dto: CreateHousekeepingDto, user: string, ip: string) {
    const hk_id = await this.generateId();

    const now = new Date().toISOString();

    const sql = `
      INSERT INTO m_housekeeping (
        hk_id, hk_name, hk_name_local_language,
        hk_contact, hk_alternate_contact,
        address, shift,
        is_active,
        inserted_at, inserted_by, inserted_ip,
        updated_at, updated_by, updated_ip
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8,$9,$10,NULL,NULL,NULL)
      RETURNING *;
    `;

    const params = [
      hk_id,
      dto.hk_name,
      dto.hk_name_local_language ?? null,
      dto.hk_contact,
      dto.hk_alternate_contact ?? null,
      dto.address ?? null,
      dto.shift,
      now,
      user,
      ip,
    ];

    const res = await this.db.query(sql, params);
    return res.rows[0];
  }

  async update(name: string, dto: UpdateHousekeepingDto, user: string, ip: string) {
    const existing = await this.findOneByName(name);
    if (!existing) throw new Error(`Housekeeping '${name}' not found`);

    const now = new Date().toISOString();

    const sql = `
      UPDATE m_housekeeping SET
        hk_name = $1,
        hk_name_local_language = $2,
        hk_contact = $3,
        hk_alternate_contact = $4,
        address = $5,
        shift = $6,
        is_active = $7,
        updated_at = $8,
        updated_by = $9,
        updated_ip = $10
      WHERE hk_id = $11
      RETURNING *;
    `;

    const params = [
      dto.hk_name ?? existing.hk_name,
      dto.hk_name_local_language ?? existing.hk_name_local_language,
      dto.hk_contact ?? existing.hk_contact,
      dto.hk_alternate_contact ?? existing.hk_alternate_contact,
      dto.address ?? existing.address,
      dto.shift ?? existing.shift,
      dto.is_active ?? existing.is_active,
      now,
      user,
      ip,
      existing.hk_id,
    ];

    const res = await this.db.query(sql, params);
    return res.rows[0];
  }

  async softDelete(name: string, user: string, ip: string) {
    const existing = await this.findOneByName(name);
    if (!existing) throw new Error(`Housekeeping '${name}' not found`);

    const now = new Date().toISOString();

    const sql = `
      UPDATE m_housekeeping SET
        is_active = false,
        updated_at = $1,
        updated_by = $2,
        updated_ip = $3
      WHERE hk_id = $4
      RETURNING *;
    `;

    const res = await this.db.query(sql, [
      now, user, ip, existing.hk_id
    ]);

    return res.rows[0];
  }
}
