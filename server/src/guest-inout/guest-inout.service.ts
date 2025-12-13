import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateGuestInOutDto } from './dto/create-guest-inout.dto';
import { UpdateGuestInoutDto } from './dto/update-guest-inout.dto';

@Injectable()
export class GuestInoutService {
  constructor(private readonly db: DatabaseService) {}

  private async generateInoutId(): Promise<string> {
    const sql = `SELECT inout_id FROM t_guest_inout ORDER BY (regexp_replace(inout_id,'\\D','','g'))::int DESC LIMIT 1`;
    const r = await this.db.query(sql);
    if (!r.rows.length) return 'IO001';
    const last = r.rows[0].inout_id;
    const next = parseInt(last.replace(/\D/g,'')) + 1;
    return 'IO' + next.toString().padStart(3,'0');
  }

  async create(dto: CreateGuestInOutDto, user?: string, ip?: string) {
    // ensure guest exists
    const g = await this.db.query(`SELECT guest_id FROM m_guest WHERE guest_id=$1 LIMIT 1`, [dto.guest_id]);
    if (!g.rows.length) throw new BadRequestException('guest not found');

    const inoutId = await this.generateInoutId();
    const sql = `
      INSERT INTO t_guest_inout (inout_id, guest_id, room_id, guest_inout, entry_date, entry_time, exit_date, exit_time, status, purpose, remarks, inserted_by, inserted_ip)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *;
    `;
    const params = [
      inoutId,
      dto.guest_id,
      dto.room_id || null,
      true,
      dto.entry_date,
      dto.entry_time,
      dto.exit_date || null,
      dto.exit_time || null,
      dto.status || 'Entered',
      dto.purpose || null,
      dto.remarks || null,
      user || 'system',
      ip || '0.0.0.0'
    ];
    const r = await this.db.query(sql, params);
    return r.rows[0];
  }

  async update(inoutId: string, dto: UpdateGuestInoutDto, user?: string, ip?: string) {
    const fields: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    for (const [k,v] of Object.entries(dto)) {
      fields.push(`${k}=$${idx}`); vals.push(v); idx++;
    }
    if (!fields.length) return null;
    fields.push(`updated_at = NOW()`); fields.push(`updated_by = $${idx}`); vals.push(user||'system'); idx++;
    fields.push(`updated_ip = $${idx}`); vals.push(ip||'0.0.0.0');
    const sql = `UPDATE t_guest_inout SET ${fields.join(', ')} WHERE inout_id = $${idx+1} RETURNING *`;
    vals.push(inoutId);
    const r = await this.db.query(sql, vals);
    return r.rows[0];
  }

  async softDelete(inoutId: string, user?: string, ip?: string) {
    const sql = `
      UPDATE t_guest_inout
      SET is_active = FALSE, updated_at = NOW(), updated_by = $2, updated_ip = $3
      WHERE inout_id = $1
      RETURNING *;
    `;
    const r = await this.db.query(sql, [inoutId, user||'system', ip||'0.0.0.0']);
    return r.rows[0];
  }

  async findAllActive() {
    const r = await this.db.query(`SELECT * FROM t_guest_inout WHERE is_active = TRUE`);
    return r.rows;
  }
}
