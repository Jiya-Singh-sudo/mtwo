import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

import { CreateGuestDto } from './dto/create-guests.dto';
import { UpdateGuestDto } from './dto/update-guests.dto';

@Injectable()
export class GuestsService {
  constructor(private readonly db: DatabaseService) {}

  // Generate ID like G001, G002 ...
  private async generateGuestId(): Promise<string> {
    const sql = `
      SELECT MAX(CAST(NULLIF(SUBSTRING(guest_id, 2), '') AS INTEGER)) AS max_id
      FROM m_guest
      WHERE guest_id ~ '^G[0-9]+$'
    `;

    const res = await this.db.query(sql);

    const last = res.rows[0]?.max_id ?? 0;
    const next = last + 1;

    return "G" + next.toString().padStart(3, "0");
  }



  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `SELECT * FROM m_guest WHERE is_active = $1 ORDER BY guest_name`
      : `SELECT * FROM m_guest ORDER BY guest_name`;

    const result = await this.db.query(sql, activeOnly ? [true] : []);
    return result.rows;
  }

  async findAllWithInOut() {
    const sql = `
      SELECT 
        g.guest_id,
        g.guest_name,
        g.guest_name_local_language,
        g.guest_mobile,
        g.guest_alternate_mobile,
        g.guest_address,
        g.id_proof_type,
        g.id_proof_no,
        g.email,

        gi.inout_id,
        gi.status,
        gi.entry_date,
        gi.entry_time,
        gi.exit_date,
        gi.exit_time,
        gi.room_id

      FROM m_guest g
      INNER JOIN t_guest_inout gi
        ON gi.inout_id = (
          SELECT inout_id
          FROM t_guest_inout
          WHERE guest_id = g.guest_id AND is_active = TRUE
          ORDER BY entry_date DESC, entry_time DESC
          LIMIT 1
        )

      WHERE g.is_active = TRUE
      ORDER BY g.guest_id ASC;
    `;

    const result = await this.db.query(sql);
    return result.rows;
  }


  async findOneByName(name: string) {
    const sql = `SELECT * FROM m_guest WHERE guest_name = $1`;
    const result = await this.db.query(sql, [name]);
    return result.rows[0];
  }

  async findOneById(id: string) {
    const sql = `SELECT * FROM m_guest WHERE guest_id = $1`;
    const result = await this.db.query(sql, [id]);
    return result.rows[0];
  }

  async create(dto: CreateGuestDto, user: string, ip: string) {
    const guest_id = await this.generateGuestId();

    const now = new Date()
      .toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false })
      .replace(',', '');

    const sql = `
      INSERT INTO m_guest (
        guest_id,
        guest_name,
        guest_name_local_language,
        guest_mobile,
        guest_alternate_mobile,
        guest_address,
        id_proof_type,
        id_proof_no,
        email,
        is_active,
        inserted_at, inserted_by, inserted_ip,
        updated_at, updated_by, updated_ip
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,
        NULL,NULL,NULL
      )
      RETURNING *;
    `;

    const params = [
      guest_id,
      dto.guest_name,
      dto.guest_name_local_language,
      dto.guest_mobile,
      dto.guest_alternate_mobile,
      dto.guest_address,
      dto.id_proof_type,
      dto.id_proof_no,
      dto.email,
      true,
      now,
      user,
      ip,
    ];

    const result = await this.db.query(sql, params);
    return result.rows[0];
  }

  async update(name: string, dto: UpdateGuestDto, user: string, ip: string) {
    const existing = await this.findOneByName(name);
    if (!existing) {
      throw new Error(`Guest '${name}' not found`);
    }

    const guest_id = existing.guest_id;

    const now = new Date()
      .toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false })
      .replace(',', '');

    const sql = `
      UPDATE m_guest SET
        guest_name = $1,
        guest_name_local_language = $2,
        guest_mobile = $3,
        guest_alternate_mobile = $4,
        guest_address = $5,
        id_proof_type = $6,
        id_proof_no = $7,
        email = $8,
        is_active = $9,
        updated_at = $10,
        updated_by = $11,
        updated_ip = $12
      WHERE guest_id = $13
      RETURNING *;
    `;

    const params = [
      dto.guest_name ?? existing.guest_name,
      dto.guest_name_local_language ?? existing.guest_name_local_language,
      dto.guest_mobile ?? existing.guest_mobile,
      dto.guest_alternate_mobile ?? existing.guest_alternate_mobile,
      dto.guest_address ?? existing.guest_address,
      dto.id_proof_type ?? existing.id_proof_type,
      dto.id_proof_no ?? existing.id_proof_no,
      dto.email ?? existing.email,
      dto.is_active ?? existing.is_active,
      now,
      user,
      ip,
      guest_id,
    ];

    const result = await this.db.query(sql, params);
    return result.rows[0];
  }

  async softDelete(id:string, ip:string, user:string) {
    const existing = await this.findOneByName(id);
    if (!existing) {
      throw new Error(`Guest '${id}' not found`);
    }

    const guest_id = existing.guest_id;
    const now = new Date().toISOString();

    const sql = `
      UPDATE m_guest SET
        is_active = false,
        updated_at = $1,
        updated_by = $2,
        updated_ip = $3
      WHERE guest_id = $4
      RETURNING *;
    `;

    const result = await this.db.query(sql, [now, user, ip, guest_id]);
    return result.rows[0];
  }
}
