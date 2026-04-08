// server/src/modules/guest-liasoning-officer/guest-liasoning-officer.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException, } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateGuestLiasoningOfficerDto, UpdateGuestLiasoningOfficerDto, } from './dto/guest-liasoning-officer.dto';
import { ActivityLogService } from 'src/activity-log/activity-log.service';
@Injectable()
export class GuestLiasoningOfficerService {
  constructor(private readonly db: DatabaseService, private readonly activityLog: ActivityLogService) {}
  private async generateLiasoningOfficerId(client: any): Promise<string> {
    const res = await client.query(`
      SELECT 'GLO' || LPAD(nextval('guest_liasoning_officer_seq')::text, 3, '0') AS id
    `);
    return res.rows[0].id;
  }
  async getGuestOfficerTable(params: {
    page: number;
    limit: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page, limit, search, sortBy, sortOrder } = params;

    const offset = (page - 1) * limit;
    const where: string[] = [
      'io.is_active = TRUE',
      'g.is_active = TRUE',
      `
      (
        (io.status = 'Scheduled' AND io.entry_date >= CURRENT_DATE)
        OR io.status IN ('Entered', 'Inside')
        OR (
          io.status = 'Exited'
          AND NOW() <= (
            io.exit_date + COALESCE(io.exit_time, TIME '00:00')
          ) + INTERVAL '24 hours'
        )
      )
      `
    ];

    const values: any[] = [];
    let idx = 1;

    /* ================= SEARCH ================= */
    if (search) {
      where.push(`
        (
          g.guest_name ILIKE $${idx}
          OR g.guest_id ILIKE $${idx}
          OR r.room_no::text ILIKE $${idx}
        )
      `);
      values.push(`%${search}%`);
      idx++;
    }

    const whereClause = `WHERE ${where.join(' AND ')}`;

    /* ================= SORT ================= */
    const allowedSorts: Record<string, string> = {
      guest_name: 'g.guest_name',
      entry_date: 'io.entry_date',
    };

    const sortColumn =
      allowedSorts[sortBy ?? 'entry_date'] ?? 'io.entry_date';

    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

    /* ================= COUNT ================= */
    const countSql = `
      SELECT COUNT(DISTINCT g.guest_id)::int AS total
      FROM t_guest_inout io
      JOIN m_guest g 
        ON g.guest_id = io.guest_id

      LEFT JOIN t_guest_room gr
        ON gr.guest_id = g.guest_id
        AND gr.is_active = TRUE
        AND gr.check_out_date IS NULL

      LEFT JOIN m_rooms r
        ON r.room_id = gr.room_id

      ${whereClause}
    `;

    /* ================= DATA ================= */
    const dataSql = `
      SELECT
        g.guest_id,
        g.guest_name,
        g.guest_mobile,

        /* ✅ CORRECT ROOM SOURCE */
        gr.room_id,
        STRING_AGG(DISTINCT r.room_no, ', ') AS room_no,

        /* ===== LIAISON ===== */
        lo.officer_id,
        s1.full_name AS liaison_name,
        s1.primary_mobile AS liaison_mobile,

        CASE
          WHEN glo.guest_officer_id IS NOT NULL THEN 'Assigned'
          ELSE NULL
        END AS liaison_status,

        /* ===== MEDICAL ===== */
        mes.service_id,
        s2.full_name AS medical_name,
        s2.primary_mobile AS medical_mobile,

        CASE
          WHEN gmc.medical_contact_id IS NOT NULL THEN 'Assigned'
          ELSE NULL
        END AS medical_status,

        io.entry_date

      FROM t_guest_inout io

      JOIN m_guest g
        ON g.guest_id = io.guest_id
        AND io.is_active = TRUE

      /* ✅ FIXED ROOM JOIN */
      LEFT JOIN t_guest_room gr
        ON gr.guest_id = g.guest_id
        AND gr.is_active = TRUE
        AND gr.check_out_date IS NULL

      LEFT JOIN m_rooms r
        ON r.room_id = gr.room_id

      /* LIAISON */
      LEFT JOIN t_guest_liasoning_officer glo
        ON glo.guest_id = g.guest_id 
        AND glo.is_active = TRUE

      LEFT JOIN m_liasoning_officer lo
        ON lo.officer_id = glo.officer_id

      LEFT JOIN m_staff s1
        ON s1.staff_id = lo.staff_id

      /* MEDICAL */
      LEFT JOIN t_guest_medical_contact gmc
        ON gmc.guest_id = g.guest_id 
        AND gmc.is_active = TRUE

      LEFT JOIN m_medical_emergency_service mes
        ON mes.service_id = gmc.service_id

      LEFT JOIN m_staff s2
        ON s2.staff_id = mes.staff_id

      ${whereClause}

      GROUP BY
        g.guest_id,
        g.guest_name,
        g.guest_mobile,
        gr.room_id,
        lo.officer_id,
        s1.full_name,
        s1.primary_mobile,
        glo.guest_officer_id,
        mes.service_id,
        s2.full_name,
        s2.primary_mobile,
        gmc.medical_contact_id,
        io.entry_date

      ORDER BY ${sortColumn} ${sortDirection}

      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    /* ================= EXECUTION ================= */
    const countResult = await this.db.query(
      countSql,
      values
    );

    values.push(limit, offset);

    const dataResult = await this.db.query(dataSql, values);

    /* ================= STATS ================= */
    const stats = {
      total: countResult.rows[0].total,
      liaisonAssigned: dataResult.rows.filter(
        (r) => r.liaison_status === 'Assigned'
      ).length,
      medicalAssigned: dataResult.rows.filter(
        (r) => r.medical_status === 'Assigned'
      ).length,
    };

    return {
      data: dataResult.rows,
      totalCount: countResult.rows[0].total,
      stats,
    };
  }
  /* ================= CREATE ================= */

  async create(
    dto: CreateGuestLiasoningOfficerDto,
    user: string,
    ip: string
  ) {
    return this.db.transaction(async (client) => {
      try {
        if (dto.to_date && dto.to_date < dto.from_date) {
          throw new BadRequestException(
            'To date cannot be before from date'
          );
        }

        // Validate guest
        const guest = await client.query(
          `SELECT 1 FROM m_guest WHERE guest_id = $1 AND is_active = TRUE FOR UPDATE`,
          [dto.guest_id]
        );
        if (!guest.rowCount) {
          throw new NotFoundException('Guest not found');
        }

        // Validate officer
        const officer = await client.query(
          `SELECT 1 FROM m_liasoning_officer WHERE officer_id = $1 AND is_active = TRUE FOR UPDATE`,
          [dto.officer_id]
        );
        if (!officer.rowCount) {
          throw new NotFoundException('Officer not found');
        }

        // Overlap protection
        const overlap = await client.query(
          `
          SELECT 1
          FROM t_guest_liasoning_officer
          WHERE
            guest_id = $1
            AND is_active = TRUE
            AND daterange(from_date, COALESCE(to_date, 'infinity'), '[]')
                && daterange($2::date, COALESCE($3::date, 'infinity'), '[]')
          FOR UPDATE
          LIMIT 1
          `,
          [dto.guest_id, dto.from_date, dto.to_date || null]
        );

        if (overlap.rowCount > 0) {
          throw new ConflictException(
            'Guest already has an officer assigned in this period'
          );
        }

        const glo_id = await this.generateLiasoningOfficerId(client);

        const insertSql = `
          INSERT INTO t_guest_liasoning_officer (
            glo_id,
            guest_id,
            officer_id,
            from_date,
            to_date,
            duty_location,
            is_active,
            inserted_by,
            inserted_ip,
            inserted_at
          )
          VALUES ($1,$2,$3,$4,$5,$6,TRUE,$7,$8,NOW())
          RETURNING *;
        `;

        const res = await client.query(insertSql, [
          glo_id,
          dto.guest_id,
          dto.officer_id,
          dto.from_date,
          dto.to_date || null,
          dto.duty_location || null,
          user,
          ip,
        ]);
        await this.activityLog.log({
          message: 'Liasoning officer assigned to guest',
          module: 'GUEST LIASONING OFFICER',
          action: 'ASSIGN',
          referenceId: glo_id,
          performedBy: user,
          ipAddress: ip,
        }, client);
        return res.rows[0];
      } catch (err) {
        throw err;
      }
    });
  }

  /* ================= FETCH BY GUEST ================= */

  async findByGuest(guestId: string) {
    const sql = `
      SELECT
        glo.glo_id,
        glo.guest_id,
        glo.officer_id,
        glo.from_date,
        glo.to_date,
        glo.duty_location,
        glo.is_active,
        glo.inserted_at,

        s.full_name,
        s.primary_mobile,

        md.designation_name AS guest_designation,
        gd.department AS guest_department

      FROM t_guest_liasoning_officer glo

      JOIN m_liasoning_officer o
        ON o.officer_id = glo.officer_id
        AND is_Active = TRUE
      LEFT JOIN m_staff s
        ON s.staff_id = o.staff_id
        AND is_active = TRUE

      LEFT JOIN t_guest_designation gd
        ON gd.guest_id = glo.guest_id
      AND gd.is_current = TRUE
      AND gd.is_active = TRUE

      LEFT JOIN m_guest_designation md
        ON md.designation_id = gd.designation_id
      AND md.is_active = TRUE

      WHERE glo.guest_id = $1
      ORDER BY glo.from_date DESC
    `;
    const res = await this.db.query(sql, [guestId]);
    return res.rows;
  }

  /* ================= UPDATE ================= */

  async update(
    id: string,
    dto: UpdateGuestLiasoningOfficerDto,
    user: string,
    ip: string
  ) {
    return this.db.transaction(async (client) => {
      const existing = await client.query(
        `SELECT * FROM t_guest_liasoning_officer WHERE glo_id = $1 FOR UPDATE`,
        [id]
      );

      if (!existing.rowCount) {
        throw new NotFoundException('Assignment not found');
      }

      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      for (const [key, value] of Object.entries(dto)) {
        if (value === undefined) continue;
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }

      if (!fields.length) {
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
        UPDATE t_guest_liasoning_officer
        SET ${fields.join(', ')}
        WHERE glo_id = $${idx}
        RETURNING *;
      `;
      values.push(id);
      const res = await client.query(sql, values);
      if (!res.rowCount) {
        throw new NotFoundException('Assignment not found');
      }
      await this.activityLog.log({
        message: 'Liasoning officer updated',
        module: 'GUEST LIASONING OFFICER',
        action: 'UPDATE',
        referenceId: id,
        performedBy: user,
        ipAddress: ip,
      }, client);

      return res.rows[0];
    });
  }

  /* ================= SOFT DELETE ================= */

  async softDelete(
    id: string,
    user: string,
    ip: string
  ) {
    return this.db.transaction(async (client) => {
      const existing = await client.query(
        `SELECT 1 FROM t_guest_liasoning_officer WHERE glo_id = $1 FOR UPDATE`,
        [id]
      );

      if (!existing.rowCount) {
        throw new NotFoundException('Assignment not found');
      }
      const sql = `
        UPDATE t_guest_liasoning_officer
        SET is_active = FALSE,
            updated_at = NOW(),
            updated_by = $2,
            updated_ip = $3
        WHERE glo_id = $1
        RETURNING *;
      `;

      const res = await client.query(sql, [id, user, ip]);

      if (!res.rowCount) {
        throw new NotFoundException('Assignment not found');
      }
      await this.activityLog.log({
        message: 'Liasoning officer unassigned from guest',
        module: 'GUEST LIASONING OFFICER',
        action: 'UNASSIGN',
        referenceId: id,
        performedBy: user,
        ipAddress: ip,
      }, client);
      return res.rows[0];
    });
  }
}
