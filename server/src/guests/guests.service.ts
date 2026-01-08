import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateGuestDto } from './dto/create-guests.dto';
import { UpdateGuestDto } from './dto/update-guests.dto';
import { translate } from '@vitalets/google-translate-api';

@Injectable()
export class GuestsService {
  constructor(private readonly db: DatabaseService) { }
  private async generateGuestId(): Promise<string> {
    const sql = `
      SELECT guest_id
      FROM m_guest
      ORDER BY CAST(SUBSTRING(guest_id, 2) AS VARCHAR) DESC
      LIMIT 1;
    `;
    const res = await this.db.query(sql);
    if (res.rows.length === 0) {
      return 'G001';
    }
    const lastId = res.rows[0].guest_id; // e.g. "G023"
    const nextNum = parseInt(lastId.substring(1), 10) + 1;
    return `G${nextNum.toString().padStart(3, '0')}`;
  }

  // create guest (transactional)
  async createFullGuest(payload: {
    guest: CreateGuestDto;
    designation?: {
      designation_id: string;
      designation_name?: string;
      department?: string;
      organization?: string;
      office_location?: string;
    };
    inout?: {
      entry_date?: string;
      entry_time?: string;
      exit_date?: string;
      exit_time?: string;
      status?: 'Entered' | 'Inside' | 'Exited';
      purpose?: string;
      remarks?: string;
    };
  }, user = 'system', ip = '0.0.0.0') {
    // transaction start
    await this.db.query('BEGIN');
    try {
      const g = payload.guest;
      
      // 1. Generate ID (seconds timestamp to fit integer)
      const guest_id = await this.generateGuestId(); 
      const translated = await translate(g.guest_name, { to: 'mr' });
      g.guest_name_local_language = translated.text;

      // 2. Insert Guest (Fixed "inserted_ip" typo here)
      const insertGuestSql = `
        INSERT INTO m_guest
          (guest_id, guest_name, guest_name_local_language, guest_mobile, guest_alternate_mobile, guest_address, email, inserted_by, inserted_ip)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
      `;
      
      const guestRes = await this.db.query(insertGuestSql, [
        guest_id, // $1
        g.guest_name, 
        g.guest_name_local_language, 
        g.guest_mobile || null, 
        g.guest_alternate_mobile || null, 
        g.guest_address || null, 
        g.email || null, 
        user, 
        ip 
      ]);
      const guestRow = guestRes.rows[0];

      // 3. Upsert m_designation
      let finalDesignationId = payload.designation?.designation_id;
      if (payload.designation?.designation_name) {
        const upsertSql = `
          INSERT INTO m_guest_designation (designation_id, designation_name, designation_name_local_language, inserted_by, inserted_ip)
          VALUES ($1, $2, NULL, $3, $4)
          ON CONFLICT (designation_id) DO UPDATE
            SET designation_name = EXCLUDED.designation_name,
                updated_at = NOW(),
                updated_by = EXCLUDED.inserted_by,
                updated_ip = EXCLUDED.inserted_ip::inet
          RETURNING *;
        `;
        const desRes = await this.db.query(upsertSql, [
          payload.designation.designation_id,
          payload.designation.designation_name,
          user, ip
        ]);
        finalDesignationId = desRes.rows[0].designation_id;
      } else {
        if (finalDesignationId) {
          const check = await this.db.query('SELECT designation_id FROM m_guest_designation WHERE designation_id = $1 LIMIT 1', [finalDesignationId]);
          if (check.rowCount === 0) {
            await this.db.query(
              `INSERT INTO m_guest_designation (designation_id, designation_name, inserted_by, inserted_ip) VALUES ($1,$2,$3,$4)`,
              [finalDesignationId, null, user, ip]
            );
          }
        }
      }

      // 4. Create t_guest_designation
      let gd_id: string | null = null;
      if (finalDesignationId) {
        gd_id = `GD${Date.now()}`; 
        const insertGdSql = `
          INSERT INTO t_guest_designation (gd_id, guest_id, designation_id, department, organization, office_location, is_current, is_active, inserted_by, inserted_ip)
          VALUES ($1,$2,$3,$4,$5,$6, TRUE, TRUE, $7, $8)
          RETURNING *;
        `;
        await this.db.query(insertGdSql, [
          gd_id,
          guestRow.guest_id,
          finalDesignationId,
          payload.designation?.department || null,
          payload.designation?.organization || null,
          payload.designation?.office_location || null,
          user, ip
        ]);
      }

      // 5. Create t_guest_inout
      const inout_id = `IN${Date.now()}`;
      const now = new Date();
      const entry_date = payload.inout?.entry_date || now.toISOString().split('T')[0];
      const entry_time = payload.inout?.entry_time || now.toTimeString().slice(0, 8);
      
      const insertIoSql = `
        INSERT INTO t_guest_inout
          (inout_id, guest_id, guest_inout, entry_date, entry_time, exit_date, exit_time, status, purpose, remarks, is_active, inserted_by, inserted_ip)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, TRUE, $11, $12)
        RETURNING *;
      `;
      
      const ioRes = await this.db.query(insertIoSql, [
        inout_id,
        guestRow.guest_id,
        true,
        entry_date,
        entry_time,
        payload.inout?.exit_date || null,
        payload.inout?.exit_time || null,
        payload.inout?.status || 'Entered',
        payload.inout?.purpose || null,
        payload.inout?.remarks || null,
        user,
        ip
      ]);

      await this.db.query('COMMIT');
      return {
        guest: guestRow,
        inout: ioRes.rows[0],
        gd_id
      };
    } catch (err) {
      await this.db.query('ROLLBACK');
      throw err;
    }
  }

  // Generic update
  async update(guestId:string, dto: UpdateGuestDto, user = 'system', ip = '0.0.0.0') {
    const allowed = new Set([
      'guest_name', 'guest_name_local_language', 'guest_mobile', 'guest_alternate_mobile',
      'guest_address', 'email'
    ]);
    const fields: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    for (const [k, v] of Object.entries(dto)) {
      if (!allowed.has(k)) continue;
      fields.push(`${k} = $${idx}`);
      vals.push(v);
      idx++;
    }
    if (fields.length === 0) return this.findOne(guestId);
    fields.push(`updated_at = NOW()`);
    fields.push(`updated_by = $${idx}`); vals.push(user); idx++;
    fields.push(`updated_ip = $${idx}`); vals.push(ip); idx++;
    const sql = `UPDATE m_guest SET ${fields.join(', ')} WHERE guest_id = $${idx} RETURNING *;`;
    vals.push(guestId);
    const r = await this.db.query(sql, vals);
    return r.rows[0];
  }

  async findOne(guestId: string) {
    const sql = `SELECT * FROM m_guest WHERE guest_id = $1 LIMIT 1`;
    const r = await this.db.query(sql, [guestId]);
    return r.rows[0];
  }

  async softDeleteGuest(guestId: string, user = 'system', ip = '0.0.0.0') {
    const sql = `
      UPDATE m_guest
      SET is_active = FALSE, updated_at = NOW(), updated_by = $2, updated_ip = $3
      WHERE guest_id = $1
      RETURNING *;
    `;
    const r = await this.db.query(sql, [guestId, user, ip]);
    return r.rows[0];
  }

  async findActiveGuestsWithInOut(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    entryDateFrom?: string;
    entryDateTo?: string;
  }) {
    const { page, limit, search, status, sortBy, sortOrder, entryDateFrom, entryDateTo } = params;

    const offset = (page - 1) * limit;

    const where: string[] = [
      'io.is_active = TRUE',
      'g.is_active = TRUE',
    ];

    const values: any[] = [];
    let idx = 1;
    
    /* ---------------- DATE FILTER ---------------- */
    if (entryDateFrom) {
      where.push(`io.entry_date >= $${idx}`);
      values.push(entryDateFrom);
      idx++;
    }

    if (entryDateTo) {
      where.push(`io.entry_date <= $${idx}`);
      values.push(entryDateTo);
      idx++;
    }
    /* ---------------- SORTING ---------------- */
    const allowedSorts: Record<string, string> = {
      guest_name: 'g.guest_name',
      designation_name: 'md.designation_name',
      entry_date: 'io.entry_date',
    };

    const sortColumn =
      allowedSorts[sortBy ?? 'entry_date'] ?? allowedSorts.entry_date;

    const sortDirection =
      sortOrder === 'asc' ? 'ASC' : 'DESC';

    /* ---------------- SEARCH ---------------- */
    if (search) {
      where.push(`
        (
          g.guest_name ILIKE $${idx}
          OR g.guest_mobile ILIKE $${idx}
          OR g.guest_id ILIKE $${idx}
        )
      `);
      values.push(`%${search}%`);
      idx++;
    }

    /* ---------------- STATUS FILTER ---------------- */
    if (status && status !== 'All') {
      where.push(`io.status = $${idx}`);
      values.push(status);
      idx++;
    }

    /* ---------------- COUNT QUERY ---------------- */
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM t_guest_inout io
      JOIN m_guest g ON g.guest_id = io.guest_id
      LEFT JOIN t_guest_designation d
        ON d.guest_id = g.guest_id
        AND d.is_current = TRUE
        AND d.is_active = TRUE
      LEFT JOIN m_guest_designation md
        ON md.designation_id = d.designation_id
      WHERE ${where.join(' AND ')}
    `;

    /* ---------------- DATA QUERY ---------------- */
    const dataSql = `
      SELECT
        g.guest_id,
        g.guest_name,
        g.guest_name_local_language,
        g.guest_mobile,
        g.guest_alternate_mobile,
        g.guest_address,
        g.email,

        d.gd_id,
        d.designation_id,
        md.designation_name,
        d.department,
        d.organization,
        d.office_location,
        d.is_current AS designation_is_current,

        io.inout_id,
        io.entry_date,
        io.entry_time,
        io.exit_date,
        io.exit_time,
        io.status AS inout_status,
        io.room_id

      FROM t_guest_inout io
      JOIN m_guest g ON g.guest_id = io.guest_id
      LEFT JOIN t_guest_designation d
        ON d.guest_id = g.guest_id
        AND d.is_current = TRUE
        AND d.is_active = TRUE
      LEFT JOIN m_guest_designation md
        ON md.designation_id = d.designation_id
      WHERE ${where.join(' AND ')}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT $${idx} OFFSET $${idx + 1};
    `;

    /* ---------------- EXECUTION ---------------- */
    const countResult = await this.db.query(
      countSql,
      values.slice(0, idx - 1)
    );

    values.push(limit, offset);

    const dataResult = await this.db.query(dataSql, values);

    return {
      data: dataResult.rows,
      totalCount: countResult.rows[0].total,
    };
  }

  async softDeleteInOut(inoutId: string, user = 'system', ip = '0.0.0.0') {
    const sql = `
      UPDATE t_guest_inout
      SET is_active = FALSE, updated_at = NOW(), updated_by = $2, updated_ip = $3
      WHERE inout_id = $1
      RETURNING *;
    `;
    const r = await this.db.query(sql, [inoutId, user, ip]);
    return r.rows[0];
  }

  async softDeleteAllGuestInOuts(guestId: string, user = 'system', ip = '0.0.0.0') {
    const sql = `
      UPDATE t_guest_inout
      SET is_active = FALSE, updated_at = NOW(), updated_by = $2, updated_ip = $3
      WHERE guest_id = $1 AND is_active = TRUE
    `;
    await this.db.query(sql, [guestId, user, ip]);
  }
 async findCheckedInWithoutVehicle() {
  const sql = `
    SELECT
      g.guest_id,
      g.guest_name,
      g.guest_name_local_language,
      g.guest_mobile,
      g.guest_alternate_mobile,
      g.email,
      g.guest_address,

      io.inout_id,
      io.entry_date,
      io.entry_time,
      io.status

    FROM t_guest_inout io
    JOIN m_guest g
      ON g.guest_id = io.guest_id

    WHERE io.is_active = TRUE
      AND io.status IN ('Entered', 'Inside')
      AND g.is_active = TRUE

      AND NOT EXISTS (
        SELECT 1
        FROM t_guest_vehicle gv
        WHERE gv.guest_id = g.guest_id
          AND gv.is_active = TRUE
      )

    ORDER BY io.entry_date DESC, io.entry_time DESC;
  `;

  const res = await this.db.query(sql);
  return res.rows;
}

}