import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateGuestDto } from './dto/create-guests.dto';
import { UpdateGuestDto } from './dto/update-guests.dto';
import { todayISO, isBefore, isAfter } from '../../common/utlis/date-utlis';
import { transliterateToDevanagari } from '../../common/utlis/transliteration.util';
import { GuestTransportService } from 'src/guest-transport/guest-transport.service';
import { ActivityLogService } from 'src/activity-log/activity-log.service';
import { GuestFoodService } from 'src/guest-food/guest-food.service';
@Injectable()
export class GuestsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly guestTransportService: GuestTransportService,
    private readonly activityLog: ActivityLogService,
    private readonly guestFoodService: GuestFoodService,
  ) { }
  private async generateDesignationId(client: any): Promise<string> {
    const res = await client.query(`
      SELECT 'DGN_' || LPAD(nextval('designation_seq')::text, 3, '0') AS id
    `);
    return res.rows[0].id;
  }
  private async generateGuestDesignationId(client: any): Promise<string> {
    const res = await client.query(`
      SELECT 'GD_' || LPAD(nextval('guest_designation_seq')::text, 3, '0') AS id
    `);
    return res.rows[0].id;
  }
  private async generateGuestId(client: any): Promise<string> {
    const res = await client.query(`
      SELECT 'G' || LPAD(nextval('guest_seq')::text, 3, '0') AS id
    `);
    return res.rows[0].id;
  }
  async getGuestStatusCounts() {
    const sql = `
      SELECT
        COUNT(DISTINCT g.guest_id)::int AS all,
        COUNT(*) FILTER (WHERE io.status = 'Scheduled')::int AS scheduled,
        COUNT(*) FILTER (WHERE io.status = 'Entered')::int AS entered,
        COUNT(*) FILTER (WHERE io.status = 'Inside')::int AS inside,
        COUNT(*) FILTER (WHERE io.status = 'Exited')::int AS exited,
        COUNT(*) FILTER (WHERE io.status = 'Cancelled')::int AS cancelled
      FROM m_guest g
      LEFT JOIN t_guest_inout io
        ON io.guest_id = g.guest_id
        AND io.is_active = TRUE
      WHERE g.is_active = TRUE;
    `;

    const { rows } = await this.db.query(sql);
    const r = rows[0];

    return {
      All: r.all,
      Scheduled: r.scheduled,
      Entered: r.entered,
      Inside: r.inside,
      Exited: r.exited,
      Cancelled: r.cancelled,
    };
  }
  // create guest (transactional)
  async createFullGuest(payload: {
      guest: CreateGuestDto;
        designation?: {
          designation_id?: string;   // 👈 ADD THIS LINE
          designation_name?: string;
          department?: string;
          organization?: string;
          office_location?: string;
          is_current?: boolean;
        };
      inout?: {
        entry_date?: string;
        entry_time?: string;
        exit_date?: string;
        exit_time?: string;
        // status?: 'Entered' | 'Inside' | 'Exited' | 'Scheduled';
        purpose?: string;
        remarks?: string;
        rooms_required?: number;
        requires_driver?: boolean;
        companions?: number;
      };
    }, user: string, ip: string) {
      // transaction start
      return this.db.transaction(async (client) => {
      const today = todayISO();
      let status: 'Entered' | 'Scheduled' | 'Exited' | 'Inside' | 'Cancelled' = 'Entered';

      // pastedGraphic.png Block back-dated entry
      // if (payload.inout?.entry_date && isBefore(payload.inout.entry_date, today)) {
      //   throw new BadRequestException('Entry date cannot be in the past');
      // }

      // pastedGraphic_1.png Auto Scheduled
      if (payload.inout?.entry_date && isAfter(payload.inout.entry_date, today)) {
        status = 'Scheduled';
      }
      // pastedGraphic_2.png Auto Exited
      if (payload.inout?.exit_date && isBefore(payload.inout.exit_date, today)) {
        status = 'Exited';
      }
      try {
        const g = payload.guest;
        if (g.guest_address && g.guest_address.length > 255) {
          throw new BadRequestException(
            'Address cannot exceed 255 characters'
          );
        }
        if (!g.guest_name?.trim()) {
          throw new BadRequestException('Guest name is required');
        }

        if (g.guest_name.length > 100) {
          throw new BadRequestException('Guest name cannot exceed 100 characters');
        }

        if (g.guest_mobile && !/^[0-9]{10}$/.test(g.guest_mobile)) {
          throw new BadRequestException('Invalid guest mobile number');
        }

        if (g.guest_alternate_mobile && !/^[0-9]{10}$/.test(g.guest_alternate_mobile)) {
          throw new BadRequestException('Invalid alternate mobile number');
        }

        if (g.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g.email)) {
          throw new BadRequestException('Invalid email format');
        }

        // 1. Generate ID (seconds timestamp to fit integer)
        const guest_id = await this.generateGuestId(client);
        // Transliteration (NON-BLOCKING & SAFE)
        const mr = transliterateToDevanagari(g.guest_name);

        // 2. Insert Guest (Fixed "inserted_ip" typo here)
        const insertGuestSql = `
          INSERT INTO m_guest
            (guest_id, guest_name, guest_name_local_language,
            guest_mobile, guest_alternate_mobile,
            guest_address, email,
            inserted_by, inserted_ip, inserted_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
          RETURNING *;
        `;

        const guestRes = await client.query(insertGuestSql, [
          guest_id, // $1
          g.guest_name,
          mr,
          g.guest_mobile || null,
          g.guest_alternate_mobile || null,
          g.guest_address || null,
          g.email || null,
          user,
          ip
        ]);
        const guestRow = guestRes.rows[0];

        // 3. Resolve designation (existing OR new)
        if (
          !payload.designation?.designation_id &&
          !payload.designation?.designation_name
        ) {
          throw new BadRequestException(
            'Either designation must be selected or new designation name must be provided'
          );
        }
        if (payload.designation.designation_id) {
          const designationCheck = await client.query(
            `SELECT 1 FROM m_guest_designation WHERE designation_id = $1 AND is_active = TRUE`,
            [payload.designation.designation_id]
          );

          if (!designationCheck.rowCount) {
            throw new BadRequestException('Invalid designation selected');
          }
        }
        let finalDesignationId: string;

        if (payload.designation.designation_id) {
          // Existing designation selected
          finalDesignationId = payload.designation.designation_id;
        } else {
          // New designation → create / upsert
          const generatedDesignationId =
            await this.generateDesignationId(client);

          const designation_name_local_language =
            transliterateToDevanagari(
              payload.designation.designation_name!
            );

          const upsertSql = `
            INSERT INTO m_guest_designation (
              designation_id,
              designation_name,
              designation_name_local_language,
              inserted_by,
              inserted_ip,
              inserted_at
            )
            VALUES ($1,$2,$3,$4,$5,NOW())
            ON CONFLICT (designation_name) DO UPDATE
              SET designation_name = EXCLUDED.designation_name,
                  designation_name_local_language = EXCLUDED.designation_name_local_language,
                  updated_at = NOW(),
                  updated_by = EXCLUDED.inserted_by,
                  updated_ip = EXCLUDED.inserted_ip::inet
            RETURNING *;
          `;

          const desRes = await client.query(upsertSql, [
            generatedDesignationId,
            payload.designation.designation_name,
            designation_name_local_language,
            user,
            ip,
          ]);

          finalDesignationId = desRes.rows[0].designation_id;
        }

        // 4. Create t_guest_designation
        const d = payload.designation;
        const gd_id = await this.generateGuestDesignationId(client);

          await client.query(
            `
            INSERT INTO t_guest_designation (
              gd_id,
              guest_id,
              designation_id,
              department,
              organization,
              office_location,
              is_current,
              is_active,
              inserted_at,
              inserted_by,
              inserted_ip
            )
            VALUES ($1,$2,$3,$4,$5,$6, TRUE, TRUE, NOW(), $7, $8)
            `,
            [
              gd_id,
              guestRow.guest_id,
              finalDesignationId,
              d?.department || null,
              d?.organization || null,
              d?.office_location || null,
              user,
              ip,
            ]
          );

        // 5. Create t_guest_inout
        if (
          payload.inout?.entry_date &&
          payload.inout?.exit_date &&
          isBefore(payload.inout.exit_date, payload.inout.entry_date)
        ) {
          throw new BadRequestException(
            'Exit date cannot be before entry date'
          );
        }
        const inout_id = `IN${Date.now()}`;
        if (!payload.inout?.entry_date || !payload.inout?.entry_time) {
          throw new BadRequestException("Entry date and time are required");
        }

        // BEFORE inserting into t_guest_inout
        const existing = await client.query(`
          SELECT 1
          FROM t_guest_inout
          WHERE guest_id = $1
            AND is_active = TRUE
          FOR UPDATE
        `, [guest_id]);

        if (existing.rowCount > 0) {
          throw new BadRequestException(
            'Guest already has an active visit'
          );
        }
        const entry_date = payload.inout.entry_date;
        const entry_time = payload.inout.entry_time;
        const companions = payload.inout?.companions ?? 0;
        const roomsRequired = payload.inout?.rooms_required ?? 1;

        if (companions < 0) {
          throw new BadRequestException('Companions cannot be negative');
        }

        if (roomsRequired <= 0) {
          throw new BadRequestException('Rooms required must be at least 1');
        }
        if (!/^\d{2}:\d{2}$/.test(entry_time)) {
          throw new BadRequestException('Invalid entry time format');
        }

        if (payload.inout?.exit_time && !/^\d{2}:\d{2}$/.test(payload.inout.exit_time)) {
          throw new BadRequestException('Invalid exit time format');
        }
        if (payload.inout?.exit_date && !payload.inout?.entry_date) {
          throw new BadRequestException('Entry date required if exit date provided');
        }
        const entryTs = new Date(`${entry_date} ${entry_time}`);
        const exitTs = payload.inout?.exit_date
          ? new Date(`${payload.inout.exit_date} ${payload.inout.exit_time || '00:00'}`)
          : null;

        if (exitTs && exitTs <= entryTs) {
          throw new BadRequestException('Exit datetime must be after entry datetime');
        }
        const insertIoSql = `
          INSERT INTO t_guest_inout
            (inout_id, guest_id, guest_inout, entry_date, entry_time, exit_date, exit_time, status, purpose, remarks, rooms_required, requires_driver, companions, is_active, inserted_at, inserted_by, inserted_ip)
          VALUES ($1,$2,$3,$4::DATE,$5,$6::DATE,$7,$8,$9,$10, $11, $12, $13, TRUE, NOW(), $14, $15)
          RETURNING *;
        `;

        const ioRes = await client.query(insertIoSql, [
          inout_id,
          guestRow.guest_id,
          true,
          entry_date,
          entry_time,
          payload.inout?.exit_date,
          payload.inout?.exit_time,
          status,
          payload.inout?.purpose || null,
          payload.inout?.remarks || null,
          payload.inout?.rooms_required ?? 1, // ➕ ADD
          payload.inout?.requires_driver ?? false, // ➕ ADD
          payload.inout?.companions ?? 0, // ➕ ADD
          user,
          ip
        ]);
      const insertedRow = ioRes.rows[0];
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
      await this.activityLog.log({
        message: 'New Guest added',
        module: 'GUESTS',
        action: 'CREATE',
        referenceId: guestRow.guest_id,
        performedBy: user,
        ipAddress: ip,
      }, client);
      await this.activityLog.log({
        message: 'Designation added for guest',
        module: 'GUEST DESIGNATION',
        action: 'CREATE',
        referenceId: gd_id,
        performedBy: user,
        ipAddress: ip,
      }, client);
      // await this.activityLog.log({
      //   message: 'New Designation added',
      //   module: 'DESIGNATION',
      //   action: 'CREATE',
      //   referenceId: gd_id,
      //   performedBy: user,
      //   ipAddress: ip,
      // }, client);
      await this.activityLog.log({
        message: 'Guest stay details added',
        module: 'GUEST INOUT',
        action: 'CREATE',
        referenceId: inout_id,
        performedBy: user,
        ipAddress: ip,
      }, client);
        return {
          guest: guestRow,
          inout: ioRes.rows[0],
          gd_id
        };
      } catch (err) {
        console.error('CREATE GUEST ERROR:', err);
        throw new BadRequestException(
          err?.message || 'Guest creation failed'
        );
      }
    });
  }
  // Generic update
  async update(guestId: string, dto: UpdateGuestDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      try {
        const statusCheck = await client.query(
          `
          SELECT status
          FROM t_guest_inout
          WHERE guest_id = $1
            AND is_active = TRUE
          FOR UPDATE
          `,
          [guestId]
        );

      if (statusCheck.rowCount > 0) {
        const status = statusCheck.rows[0].status;

        if (['Exited', 'Cancelled'].includes(status)) {
          throw new BadRequestException(
            `Cannot edit guest once status is ${status}`
          );
        }
      }
      const allowed = new Set([
        'guest_name', 'guest_name_local_language', 'guest_mobile', 'guest_alternate_mobile',
        'guest_address', 'email'
      ]);
      const fields: string[] = [];
      const vals: any[] = [];
      let idx = 1;
      for (const [k, v] of Object.entries(dto)) {
        if (!allowed.has(k)) continue;
        if (k === 'guest_address' && typeof v === 'string' && v.length > 255) {
          throw new BadRequestException(
            'Address cannot exceed 255 characters'
          );
        }
        if (k === 'guest_name') {
          if (!v || typeof v !== 'string' || !v.trim()) {
            throw new BadRequestException('Guest name is required');
          }
          if (v.length > 100) {
            throw new BadRequestException('Guest name cannot exceed 100 characters');
          }
        }

        if (k === 'guest_mobile' && v) {
          if (!/^[0-9]{10}$/.test(String(v))) {
            throw new BadRequestException('Invalid guest mobile number');
          }
        }

        if (k === 'guest_alternate_mobile' && v) {
          if (!/^[0-9]{10}$/.test(String(v))) {
            throw new BadRequestException('Invalid alternate mobile number');
          }
        }

        if (k === 'email' && v) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v))) {
            throw new BadRequestException('Invalid email format');
          }
        }

        fields.push(`${k} = $${idx}`);
        vals.push(v);
        idx++;
      }
      if (fields.length === 0) {
        return this.findOne(guestId);
      }
      fields.push(`updated_at = NOW()`);
      fields.push(`updated_by = $${idx}`); vals.push(user); idx++;
      fields.push(`updated_ip = $${idx}`); vals.push(ip); idx++;
      const sql = 
      `UPDATE m_guest
        SET
          ${fields.join(', ')},
          version = version + 1
        WHERE
          guest_id = $${idx}
        RETURNING *;
      `;
      vals.push(guestId);
      const r = await client.query(sql, vals);
      await this.activityLog.log({
        message: 'Guest details updated',
        module: 'GUESTS',
        action: 'UPDATE',
        referenceId: guestId,
        performedBy: user,
        ipAddress: ip,
      }, client);

      return r.rows[0];
      } catch (err) {
        console.error('Guest update failed:', err);
        throw new BadRequestException('Guest update failed');
      }
    });
  }

  async findOne(guestId: string) {
    const sql = `SELECT * FROM m_guest WHERE guest_id = $1 LIMIT 1`;
    const r = await this.db.query(sql, [guestId]);
    if (!r.rowCount) {
      throw new BadRequestException('Guest not found');
    }
    return r.rows[0];
  }

  async softDeleteGuest(guestId: string, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      try {
        
        // 1. Deactivate guest
        const sql = `
          UPDATE m_guest
          SET is_active = FALSE,
              updated_at = NOW(),
              updated_by = $2,
              updated_ip = $3
          WHERE guest_id = $1
          RETURNING *;
        `;
        const r = await client.query(sql, [guestId, user, ip]);
        if (!r.rowCount) {
          throw new BadRequestException('Guest not found');
        }
        const activeInouts = await client.query(`
          SELECT inout_id
          FROM t_guest_inout
          WHERE guest_id = $1
          AND is_active = TRUE
          FOR UPDATE
        `, [guestId]);
        await client.query(`
          UPDATE t_guest_inout
          SET status = 'Exited',
              is_active = FALSE,
              updated_at = NOW(),
              updated_by = $2,
              updated_ip = $3
          WHERE guest_id = $1
            AND is_active = TRUE
        `, [guestId, user, ip]);

        for (const row of activeInouts.rows) {
          await this.cascadeGuestExit(row.inout_id, client, user, ip);
        }
        // 2. Cascade exit
      await this.activityLog.log({
        message: 'Guest deleted',
        module: 'GUESTS',
        action: 'DELETE',
        referenceId: guestId,
        performedBy: user,
        ipAddress: ip,
      }, client);
        return r.rows[0];
      } catch (err) {
        console.error('Guest delete failed:', err);
        throw new BadRequestException('Guest deletion failed');
      }
    });
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
    if (page <= 0 || limit <= 0) {
      throw new BadRequestException('Page and limit must be greater than 0');
    }

    if (limit > 100) {
      throw new BadRequestException('Limit cannot exceed 100');
    }
    const values: any[] = [];
    let idx = 1;

    /* ---------------- DATE FILTER ---------------- */
    let fromDate = entryDateFrom;
    let toDate = entryDateTo;

    /* If no date filters provided → apply default window */
    if (!fromDate && !toDate) {
      where.push(`
        io.entry_date BETWEEN
          (CURRENT_DATE - INTERVAL '15 days')
          AND
          (CURRENT_DATE + INTERVAL '15 days')
      `);
    } else {
      if (fromDate) {
        where.push(`io.entry_date >= $${idx}`);
        values.push(fromDate);
        idx++;
      }

      if (toDate) {
        where.push(`io.entry_date <= $${idx}`);
        values.push(toDate);
        idx++;
      }
    }
    if (entryDateFrom && isNaN(Date.parse(entryDateFrom))) {
      throw new BadRequestException('Invalid entryDateFrom');
    }

    if (entryDateTo && isNaN(Date.parse(entryDateTo))) {
      throw new BadRequestException('Invalid entryDateTo');
    }
    if (entryDateFrom && entryDateTo && entryDateFrom > entryDateTo) {
      throw new BadRequestException('entryDateFrom must be before entryDateTo');
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
      SELECT COUNT(DISTINCT g.guest_id)::int AS total
      FROM m_guest g
      LEFT JOIN t_guest_inout io
        ON io.guest_id = g.guest_id
      LEFT JOIN t_guest_designation d
        ON d.guest_id = g.guest_id
        AND d.is_current = TRUE
      LEFT JOIN m_guest_designation md
        ON md.designation_id = d.designation_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
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
        md.designation_name_local_language,
        d.department,
        d.organization,
        d.office_location,
        d.is_current AS designation_is_current,

        io.inout_id,
        io.entry_date::TEXT AS entry_date,
        io.entry_time,
        io.exit_date::TEXT AS exit_date,
        io.exit_time,
        io.status AS inout_status,
        io.purpose,
        io.status,
        io.rooms_required,
        io.requires_driver,
        io.companions

      FROM m_guest g
      LEFT JOIN t_guest_inout io
        ON io.guest_id = g.guest_id
        AND io.is_active = TRUE
      LEFT JOIN t_guest_designation d
        ON d.guest_id = g.guest_id
        AND d.is_current = TRUE
      LEFT JOIN m_guest_designation md
        ON md.designation_id = d.designation_id

      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
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

  async softDeleteInOut(inoutId: string, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      const sql = `
        UPDATE t_guest_inout
        SET is_active = FALSE, updated_at = NOW(), updated_by = $2, updated_ip = $3
        WHERE inout_id = $1
        RETURNING *;
      `;
      const r = await client.query(sql, [inoutId, user, ip]);
        await this.activityLog.log({
          message: 'Guest stay cancelled',
          module: 'GUEST INOUT',
          action: 'CANCEL',
          referenceId: inoutId,
          performedBy: user,
          ipAddress: ip,
        }, client);
      if (!r.rowCount) {
        throw new BadRequestException('InOut record not found');
      }

      return r.rows[0];
    });
  }

  async updateGuestInOut(
    inoutId: string,
    payload: {
      entry_date?: string;
      entry_time?: string;
      exit_date?: string;
      exit_time?: string;
      status?: 'Scheduled' | 'Entered' | 'Inside' | 'Exited' | 'Cancelled';
      rooms_required?: number;
      requires_driver?: boolean;
      companions?: number;
    },
    user: string,
    ip: string
  ) {
    return this.db.transaction(async (client) => {
      try {
      const lockRes = await client.query(
        `
        SELECT *
        FROM t_guest_inout
        WHERE inout_id = $1
        FOR UPDATE
        `,
        [inoutId]
      );

      if (!lockRes.rowCount) {
        throw new BadRequestException('InOut record not found');
      }
      const existingInout = lockRes.rows[0];
      const entryDate = payload.entry_date ?? existingInout.entry_date;
      const entryTime = payload.entry_time ?? existingInout.entry_time;
      const exitDate = payload.exit_date ?? existingInout.exit_date;
      const exitTime = payload.exit_time ?? existingInout.exit_time;

      if (exitDate) {
        const entryTs = new Date(`${entryDate} ${entryTime || '00:00'}`);
        const exitTs = new Date(`${exitDate} ${exitTime || '23:59'}`);

        if (exitTs <= entryTs) {
          throw new BadRequestException('Exit datetime must be after entry datetime');
        }
      }
      const currentRoomsRes = await client.query(`
        SELECT r.room_capacity
        FROM t_guest_room gr
        JOIN m_rooms r ON r.room_id = gr.room_id
        WHERE gr.guest_id = $1
          AND gr.is_active = TRUE
      `, [existingInout.guest_id]);

      const currentRoomCount = currentRoomsRes.rowCount;
      const currentTotalCapacity = currentRoomsRes.rows.reduce(
        (sum, r) => sum + Number(r.room_capacity),
        0
      );
      if (payload.status) {
        const currentStatus = existingInout.status;

        const allowedTransitions: Record<string, string[]> = {
          Scheduled: ['Entered', 'Cancelled'],
          Entered: ['Inside', 'Exited'],
          Inside: ['Exited'],
        };

        if (
          allowedTransitions[currentStatus] &&
          !allowedTransitions[currentStatus].includes(payload.status)
        ) {
          throw new BadRequestException(
            `Invalid status transition from ${currentStatus} to ${payload.status}`
          );
        }
      }
      const newRoomsRequired = payload.rooms_required ?? existingInout.rooms_required;
      const newCompanions = payload.companions ?? existingInout.companions ?? 0;
      const totalPeople = 1 + newCompanions;

      // 🚨 Rule 1: cannot reduce rooms_required below already allocated rooms
      if (newRoomsRequired < currentRoomCount) {
        throw new BadRequestException(
          `Rooms required cannot be less than already allocated rooms (${currentRoomCount})`
        );
      }
      if (payload.rooms_required !== undefined && payload.rooms_required <= 0) {
        throw new BadRequestException('Rooms required must be at least 1');
      }

      if (payload.companions !== undefined && payload.companions < 0) {
        throw new BadRequestException('Companions cannot be negative');
      }
      if (payload.entry_time && !/^\d{2}:\d{2}$/.test(payload.entry_time)) {
        throw new BadRequestException('Invalid entry time format');
      }

      if (payload.exit_time && !/^\d{2}:\d{2}$/.test(payload.exit_time)) {
        throw new BadRequestException('Invalid exit time format');
      }
      // 🚨 Rule 2: if allocation is already complete, capacity must still satisfy people
      if (
        currentRoomCount === newRoomsRequired &&
        currentTotalCapacity < totalPeople
      ) {
        throw new BadRequestException(
          `Current allocated room capacity (${currentTotalCapacity}) is insufficient for ${totalPeople} people`
        );
      }

      if (
        payload.entry_date &&
        payload.exit_date &&
        isBefore(payload.exit_date, payload.entry_date)
      ) {
        throw new BadRequestException(
          'Exit date cannot be before entry date'
        );
      }
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      for (const [key, value] of Object.entries(payload)) {
        if (value === undefined) continue;
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }

      if (fields.length === 0) {
        throw new BadRequestException('No fields to update');
      }

      fields.push(`updated_at = NOW()`);
      fields.push(`updated_by = $${idx}`);
      values.push(user);
      idx++;

      fields.push(`updated_ip = $${idx}`);
      values.push(ip);
      idx++;

      const sql = `
      UPDATE t_guest_inout
      SET ${fields.join(', ')}
      WHERE inout_id = $${idx}
        AND is_active = TRUE
      RETURNING *;
    `;

      values.push(inoutId);
      const res = await client.query(sql, values);
      await this.activityLog.log({
        message: 'Guest stay details updated',
        module: 'GUEST INOUT',
        action: 'UPDATE',
        referenceId: inoutId,
        performedBy: user,
        ipAddress: ip,
      }, client);
      const updated = res.rows[0]; 
      if (!updated){
        throw new BadRequestException('InOut record not found');
      }
      
      // 🔑 AUTO-RELEASE ASSIGNMENTS ON EXIT / CANCEL
      if (
        updated.guest_id &&
        (payload.status === 'Exited' || payload.status === 'Cancelled')
      ) {
        await this.cascadeGuestExit(
          updated.inout_id,
          client,
          user,
          ip
        );
      } 

      // 🔴 ADD THIS BLOCK
      let warnings = [];
      if (
        payload.entry_date || payload.exit_date ||
        payload.entry_time || payload.exit_time
      ) {
        const entryTs = new Date(
          `${updated.entry_date} ${updated.entry_time || '00:00'}`
        );
        const exitTs = new Date(
          `${updated.exit_date} ${updated.exit_time || '23:59'}`
        );

        warnings = await this.guestTransportService
          .findTransportConflictsForGuest(
            updated.guest_id,
            entryTs,
            exitTs,
            client
          );
      }
      return {
        inout: updated,
        warnings, // 🔑 FRONTEND NEEDS THIS
      };
      } catch (err) {
        throw err;
      }
    });
  }

  async softDeleteAllGuestInOuts(guestId: string, user: string, ip: string) {
    const sql = `
      UPDATE t_guest_inout
      SET is_active = FALSE, updated_at = NOW(), updated_by = $2, updated_ip = $3
      WHERE guest_id = $1 AND is_active = TRUE
    `;
    const result = await this.db.query(sql, [guestId, user, ip]);

    if (!result.rowCount) {
      throw new BadRequestException('No active inouts found for guest');
    }
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
    io.status,
    io.exit_date,
    io.exit_time,
    io.purpose,
    io.remarks,
    io.requires_driver,

    gd.department,
    gd.organization,
    gd.office_location,

    md.designation_id,
    md.designation_name,
    md.designation_name_local_language

  FROM t_guest_inout io
  JOIN m_guest g
    ON g.guest_id = io.guest_id

  LEFT JOIN t_guest_designation gd
    ON gd.guest_id = g.guest_id
    AND gd.is_current = TRUE
    AND gd.is_active = TRUE

  LEFT JOIN m_guest_designation md
    ON md.designation_id = gd.designation_id
    AND md.is_active = TRUE

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
    if (!res.rowCount) {
      return [];
    }
    return res.rows;
  }
  private async cascadeGuestExit(
    inoutId: string,
    trx = this.db,
    user: string,
    ip: string
  ) {
    // Get guest_id from inout
    const inoutRes = await trx.query(
      `SELECT guest_id FROM t_guest_inout WHERE inout_id = $1 FOR UPDATE`,
      [inoutId]
    );
    if (!inoutRes.rowCount) {
      throw new BadRequestException('Invalid inout record');
    }
    const guestId = inoutRes.rows[0].guest_id;
      const guestRooms = await trx.query(
        `
        SELECT guest_room_id, room_id
        FROM t_guest_room
        WHERE guest_id = $1 AND is_active = TRUE
        FOR UPDATE
        `,
        [guestId]
      );

      for (const gr of guestRooms.rows) {
        // 1️⃣ Close guest-room assignment
        await trx.query(
          `
          UPDATE t_guest_room
          SET
            is_active = FALSE,
            check_out_date = CURRENT_DATE,
            action_type = 'Room-Released',
            action_description = 'Auto-released on guest exit',
            updated_at = NOW(),
            updated_by = $2,
            updated_ip = $3
          WHERE guest_room_id = $1
          `,
          [gr.guest_room_id, user, ip]
        );

        // 2️⃣ Free the room
        await trx.query(
          `
          UPDATE m_rooms
          SET status = 'Available',
              updated_at = NOW(),
              updated_by = $2,
              updated_ip = $3
          WHERE room_id = $1
          `,
          [gr.room_id, user, ip]
        );

        // 3️⃣ Cancel housekeeping
        await trx.query(
          `
          UPDATE t_guest_hk
          SET
            status = 'Unassigned',
            is_active = FALSE,
            updated_at = NOW(),
            updated_by = $2,
            updated_ip = $3
          WHERE guest_id = $1
            AND is_active = TRUE
          `,
          [gr.guest_id, user, ip]
        );
      }
 
    /* ================= HOUSEKEEPING ================= */

    await trx.query(
      `
      UPDATE t_guest_hk
      SET is_active = FALSE,
          updated_at = NOW(),
          updated_by = $2,
          updated_ip = $3
      WHERE guest_id = $1 AND is_active = TRUE
      `,
      [guestId, user, ip]
    );

    /* ================= VEHICLES ================= */

    await trx.query(
      `
      UPDATE t_guest_vehicle
      SET is_active = FALSE,
          updated_at = NOW(),
          updated_by = $2,
          updated_ip = $3
      WHERE guest_id = $1 AND is_active = TRUE
      `,
      [guestId, user, ip]
    );

    /* ================= DRIVERS ================= */

    await trx.query(
      `
      UPDATE t_guest_driver
      SET is_active = FALSE,
          updated_at = NOW(),
          updated_by = $2,
          updated_ip = $3
      WHERE guest_id = $1 AND is_active = TRUE
      `,
      [guestId, user, ip]
    );

    /* ================= BUTLER ================= */

    await trx.query(
      `
      UPDATE t_guest_butler
      SET is_active = FALSE,
          updated_at = NOW(),
          updated_by = $2,
          updated_ip = $3
      WHERE guest_id = $1 AND is_active = TRUE
      `,
      [guestId, user, ip]
    );
    /* ================= FOOD ================= */

    await trx.query(`
      UPDATE t_guest_food
      SET is_active = FALSE,
          updated_at = NOW(),
          updated_by = $2,
          updated_ip = $3
      WHERE guest_id = $1 AND is_active = TRUE
    `, [guestId, user, ip]);


    /* ================= MESSENGER ================= */
    await trx.query(`
      UPDATE t_guest_messenger
      SET is_active = FALSE,
          updated_at = NOW(),
          updated_by = $2,
          updated_ip = $3
      WHERE guest_id = $1 AND is_active = TRUE
    `, [guestId, user, ip]);

    /* ================= NETWORK ================= */

    await trx.query(`
      UPDATE t_guest_network
      SET is_active = FALSE,
          network_status = 'Disconnected',
          updated_at = NOW(),
          updated_by = $2,
          updated_ip = $3
      WHERE guest_id = $1 AND is_active = TRUE
    `, [guestId, user, ip]);

  
    /* ================= LIAISONING OFFICER ================= */
    await trx.query(`
      UPDATE t_guest_liaisoning_officer
      SET is_active = FALSE,
          assignment_end_date = CURRENT_DATE,
          updated_at = NOW(),
          updated_by = $2,
          updated_ip = $3
      WHERE guest_id = $1 AND is_active = TRUE
    `, [guestId, user, ip]);

    /* ================= MEDICAL CONTACT ================= */
    await trx.query(`
      UPDATE t_guest_medical_contact
      SET is_active = FALSE,
          updated_at = NOW(),
          updated_by = $2,
          updated_ip = $3
      WHERE guest_id = $1 AND is_active = TRUE
    `, [guestId, user, ip]);

    await this.activityLog.log({
      message: 'Rooms, drivers, vehicles, messangers, liaisoning officers, medical contacts, butlers, and networks have been deleted for the exited guest inouts',
      module: 'GUEST INOUT',
      action: 'EXIT',
      referenceId: guestId,
      performedBy: user,
      ipAddress: ip,
    }, trx);
  }
  async getTransportConflictsForGuest(guestId: string) {
    const guestCheck = await this.db.query(
      `SELECT 1 FROM m_guest WHERE guest_id = $1 AND is_active = TRUE`,
      [guestId]
    );

    if (!guestCheck.rowCount) {
      throw new BadRequestException('Guest not found or inactive');
    }
    const driverSql = `
    SELECT
      gd.guest_driver_id,
      gd.driver_id,
      d.driver_name,
      gd.trip_date,
      gd.start_time,
      gd.drop_date,
      gd.drop_time
    FROM t_guest_driver gd
    JOIN m_driver d ON d.driver_id = gd.driver_id
    WHERE
      gd.guest_id = $1
      AND gd.is_active = TRUE
  `;

    const vehicleSql = `
    SELECT
      gv.guest_vehicle_id,
      gv.vehicle_no,
      v.vehicle_name,
      gv.assigned_at,
      gv.released_at
    FROM t_guest_vehicle gv
    JOIN m_vehicle v ON v.vehicle_no = gv.vehicle_no
    WHERE
      gv.guest_id = $1
      AND gv.is_active = TRUE
  `;

    const [drivers, vehicles] = await Promise.all([
      this.db.query(driverSql, [guestId]),
      this.db.query(vehicleSql, [guestId]),
    ]);

    return {
      drivers: drivers.rows,
      vehicles: vehicles.rows,
    };
  }
  async syncExpiredGuestInOuts(user: string, ip: string) {
    return this.db.transaction(async (client) => {

      try {
        // 1️⃣ Find all inouts that SHOULD be exited but are not
        const expired = await client.query(`
          SELECT inout_id, guest_id
          FROM t_guest_inout
          WHERE
            is_active = TRUE
            AND status NOT IN ('Exited', 'Cancelled')
            AND exit_date IS NOT NULL
            AND exit_date < CURRENT_DATE 
          FOR UPDATE SKIP LOCKED
        `);

      // const guestIds = new Set<string>();

      for (const row of expired.rows) {
        if (!row.inout_id) {
          continue;
        }
        await client.query(
          `
          UPDATE t_guest_inout
          SET
            status = 'Exited',
            is_active = FALSE,
            updated_at = NOW(),
            updated_by = $2,
            updated_ip = $3
          WHERE inout_id = $1
          `,
          [row.inout_id, user, ip]
        );

        // guestIds.add(row.guest_id);
      }

      for (const row of expired.rows) {
        await this.cascadeGuestExit(row.inout_id, client, user, ip);
        await this.activityLog.log({
          message: 'Rooms, drivers, vehicles, messangers, liaisoning officers, medical contacts, butlers, and networks have been deleted for the exited guest inouts',
          module: 'GUEST INOUT',
          action: 'EXIT',
          referenceId: row.inout_id,
          performedBy: user,
          ipAddress: ip,
        }, client);
      }
        return { updated: expired.rowCount };
      } catch (err) {
        throw err;
      }
    });
  }
  private async assertRoomAvailable(
    roomId: string,
    from: string,
    to: string,
    client: any,
    excludeGuestId?: string
  ) {
    if (!from || !to) {
      throw new BadRequestException('From and To dates are required');
    }

    if (isNaN(Date.parse(from)) || isNaN(Date.parse(to))) {
      throw new BadRequestException('Invalid date format');
    }

    if (from > to) {
      throw new BadRequestException('From date must be before To date');
    }
    const res = await client.query(
      `
      SELECT 1
      FROM t_guest_room
      WHERE
        room_id = $1
        AND is_active = TRUE
        AND daterange(
              check_in_date,
              COALESCE(check_out_date, CURRENT_DATE),
              '[]'
            )
            && daterange($2::date, $3::date, '[]')
        ${excludeGuestId ? 'AND inout_id <> $4' : ''}
      FOR UPDATE
      LIMIT 1
      `,
      excludeGuestId
        ? [roomId, from, to, excludeGuestId]
        : [roomId, from, to]
    );

    if (res.rowCount > 0) {
      throw new BadRequestException(
        'Room is already allocated for the selected dates'
      );
    }
  }

}
