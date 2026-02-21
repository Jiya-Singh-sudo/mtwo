import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateGuestInOutDto } from './dto/create-guest-inout.dto';
import { UpdateGuestInoutDto } from './dto/update-guest-inout.dto';
import { todayISO, isBefore, isAfter } from '../../common/utlis/date-utlis';
import { GuestFoodService } from 'src/guest-food/guest-food.service';

@Injectable()
export class GuestInoutService {
  constructor(private readonly db: DatabaseService, private readonly guestFoodService: GuestFoodService) {}

  // private async generateInoutId(): Promise<string> {
  //   const sql = `
  //     SELECT inout_id
  //     FROM t_guest_inout
  //     ORDER BY CAST(SUBSTRING(inout_id, 6) AS INTEGER) DESC
  //     LIMIT 1;
  //   `;
  //   const res = await this.db.query(sql);
  //   if (res.rows.length === 0) {
  //     return 'INOUT001';
  //   }
  //   const lastId = res.rows[0].inout_id; // e.g. "INOUT014"
  //   const nextNum = parseInt(lastId.substring(5), 10) + 1;
  //   return `INOUT${nextNum.toString().padStart(3, '0')}`;
  // }
  private async generateInoutId(client: any): Promise<string> {
    const res = await client.query(`
      SELECT 'INOUT' || LPAD(nextval('guest_inout_seq')::text, 3, '0') AS id
    `);
    return res.rows[0].id;
  }

  async create(dto: CreateGuestInOutDto, user?: string, ip?: string) {
    // ensure guest exists
    return this.db.transaction(async (client) => {

      const g = await client.query(
        `SELECT guest_id FROM m_guest WHERE guest_id=$1 FOR UPDATE`,
        [dto.guest_id]
      );

      if (!g.rows.length) throw new BadRequestException('guest not found');

      const inoutId = await this.generateInoutId(client);
      const sql = `
        INSERT INTO t_guest_inout (inout_id, guest_id, room_id, guest_inout, entry_date, entry_time, exit_date, exit_time, status, purpose, remarks, inserted_by, inserted_ip, inserted_at)
        VALUES ($1,$2,$3,$4,$5::DATE,$6,$7::DATE,$8,$9,$10,$11,$12,$13, NOW())
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
        user,
        ip
      ];
      const r = await client.query(sql, params);
      const insertedRow = r.rows[0];

      // ✅ Propagate daily meal plan ONLY if guest actually entered today
      const today = todayISO();

      if (
        insertedRow.status === 'Entered' &&
        insertedRow.entry_date?.toISOString().split('T')[0] === today
      ) {

        await this.guestFoodService.propagateTodayPlanToGuest(
          client,
          insertedRow,
          user || 'system',
          ip || '0.0.0.0'
        );
      }

      return insertedRow;
    });
  }

  async update(inoutId: string, dto: UpdateGuestInoutDto, user?: string, ip?: string) {
    return this.db.transaction(async (client) => {
      const fields: string[] = [];
      const vals: any[] = [];
      let idx = 1;

      const today = todayISO();
      const now = new Date();

      // 🔍 Load existing row
      const existing = await client.query(
        `SELECT entry_date FROM t_guest_inout WHERE inout_id = $1 FOR UPDATE`,
        [inoutId]
      );

      if (!existing.rows.length) {
        throw new BadRequestException('Invalid inout record');
      }

      // ✅ NORMALIZED existing entry date
      const existingEntryDate = existing.rows[0].entry_date
        ? existing.rows[0].entry_date.toISOString().split('T')[0]
        : null;

      let status = dto.status ?? 'Entered';

      // ❌ Block back-dated entry ONLY if user actually changed it
      if (
        dto.entry_date &&
        dto.entry_date !== existingEntryDate &&
        isBefore(dto.entry_date, today)
      ) {
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

      // Apply DTO fields
      for (const [k, v] of Object.entries(dto)) {
        if (v === '' || v === undefined) continue;
        if (k === 'status') continue; // 🚫 status handled separately
        fields.push(`${k} = $${idx}`);
        vals.push(v);
        idx++;
      }

      // 🔥 Enforce status
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
      const r = await client.query(sql, vals);
      return r.rows[0];
    });
  }

  async softDelete(inoutId: string, user?: string, ip?: string) {
    return this.db.transaction(async (client) => {
      const existing = await client.query(
        `SELECT 1 FROM t_guest_inout WHERE inout_id = $1 FOR UPDATE`,
        [inoutId]
      );

      if (!existing.rowCount) {
        throw new BadRequestException('Invalid inout record');
      }
      const sql = `
        UPDATE t_guest_inout
        SET is_active = FALSE, updated_at = NOW(), updated_by = $2, updated_ip = $3
        WHERE inout_id = $1
        RETURNING *;
      `;
      const r = await client.query(sql, [inoutId, user, ip]);
      return r.rows[0];
    });
  }

  async findAllActive() {
      const sql = `
    SELECT
      io.inout_id,
      io.guest_id,
      g.guest_name,
      io.entry_date,
      io.entry_time,
      io.exit_date,
      io.exit_time,
      io.status,
      io.purpose,
      io.remarks,
      io.rooms_required,
      io.requires_driver,
      io.companions
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
