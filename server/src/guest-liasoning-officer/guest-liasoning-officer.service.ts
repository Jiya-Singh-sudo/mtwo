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
