import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateGuestInOutDto } from './dto/create-guest-inout.dto';
import { UpdateGuestInoutDto } from './dto/update-guest-inout.dto';
import { todayISO, isBefore, isAfter } from '../../common/utlis/date-utlis';

@Injectable()
export class GuestInoutService {
  constructor(private readonly db: DatabaseService) {}

  private async generateInoutId(): Promise<string> {
    const sql = `
      SELECT inout_id
      FROM t_guest_inout
      ORDER BY CAST(SUBSTRING(inout_id, 6) AS INTEGER) DESC
      LIMIT 1;
    `;
    const res = await this.db.query(sql);
    if (res.rows.length === 0) {
      return 'INOUT001';
    }
    const lastId = res.rows[0].inout_id; // e.g. "INOUT014"
    const nextNum = parseInt(lastId.substring(5), 10) + 1;
    return `INOUT${nextNum.toString().padStart(3, '0')}`;
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

    const today = todayISO();
    const now = new Date();

    let status = dto.status ?? 'Entered';

    // ❌ Block back-dated entry
    if (dto.entry_date && isBefore(dto.entry_date, today)) {
      throw new BadRequestException('Entry date cannot be in the past');
    }

    // 📅 Auto Scheduled
    if (dto.entry_date && isAfter(dto.entry_date, today)) {
      status = 'Scheduled';
    }

    // 🚪 Auto Exited
    if (dto.exit_date && isBefore(dto.exit_date, today)) {
      status = 'Exited';
    }

    // Apply DTO fields (skip empty strings)
    for (const [k, v] of Object.entries(dto)) {
      if (v === '' || v === undefined) continue;
      fields.push(`${k} = $${idx}`);
      vals.push(v);
      idx++;
    }

    // 🔥 Enforced business rules
    fields.push(`status = $${idx}`);
    vals.push(status);
    idx++;

    if (status === 'Exited' || status === 'Cancelled') {
      fields.push(`is_active = FALSE`);

      if (!dto.exit_date) {
        fields.push(`exit_date = $${idx}`);
        vals.push(today);
        idx++;
      }

      if (!dto.exit_time) {
        fields.push(`exit_time = $${idx}`);
        vals.push(now.toTimeString().slice(0, 8));
        idx++;
      }
    }

    if (!fields.length) return null;

    fields.push(`updated_at = NOW()`);
    fields.push(`updated_by = $${idx}`);
    vals.push(user || 'system');
    idx++;

    fields.push(`updated_ip = $${idx}`);
    vals.push(ip || '0.0.0.0');

    const sql = `
      UPDATE t_guest_inout
      SET ${fields.join(', ')}
      WHERE inout_id = $${idx + 1}
      RETURNING *;
    `;

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
      const sql = `
    SELECT
      io.inout_id,
      io.guest_id,
      g.guest_name
    FROM t_guest_inout io
    JOIN m_guest g
      ON g.guest_id = io.guest_id
    WHERE io.is_active = TRUE
      AND g.is_active = TRUE
    ORDER BY g.guest_name;
  `;

  const r = await this.db.query(sql);
  return r.rows;
  }
}
