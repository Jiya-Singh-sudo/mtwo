import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateGuestMedicalContactDto, UpdateGuestMedicalContactDto } from './dto/guest-medical-contact.dto';

@Injectable()
export class GuestMedicalContactService {
  constructor(private readonly db: DatabaseService) {}
  private async generateMedicalContactId(client: any): Promise<string> {
    const res = await client.query(`
      SELECT 'GMC' || LPAD(nextval('guest_medical_contact_seq')::text, 3, '0') AS id
    `);
    return res.rows[0].id;
  }
  /* ================= CREATE ================= */

  async create(
    dto: CreateGuestMedicalContactDto,
    user: string,
    ip: string
  ) {
    return this.db.transaction(async (client) => {
      try {
        // Validate guest exists
        const guest = await client.query(
          `SELECT 1 FROM m_guest WHERE guest_id = $1 AND is_active = TRUE FOR UPDATE`,
          [dto.guest_id]
        );

        if (!guest.rowCount) {
          throw new NotFoundException('Guest not found');
        }

        // Validate service exists
        const service = await client.query(
          `SELECT 1 FROM m_medical_emergency_service 
          WHERE service_id = $1 AND is_active = TRUE FOR UPDATE`,
          [dto.service_id]
        );

        if (!service.rowCount) {
          throw new NotFoundException('Medical service not found');
        }

        // Prevent duplicate active mapping
        const duplicate = await client.query(
          `
          SELECT 1 FROM t_guest_medical_contact
          WHERE guest_id = $1
            AND service_id = $2
            AND is_active = TRUE
          FOR UPDATE
          `,
          [dto.guest_id, dto.service_id]
        );

        if (duplicate.rowCount > 0) {
          throw new ConflictException(
            'Medical contact already assigned to guest'
          );
        }

        const medical_contact_id = await this.generateMedicalContactId(client);

        const insertSql = `
          INSERT INTO t_guest_medical_contact (
            medical_contact_id,
            service_id,
            guest_id,
            is_active,
            inserted_at,
            inserted_by,
            inserted_ip,
          )
          VALUES ($1,$2,$3,$4,NOW(),$5,$6)
          RETURNING *;
        `;

        const res = await client.query(insertSql, [
          medical_contact_id,
          dto.service_id,
          dto.guest_id,
          dto.is_active ?? true,
          user,
          ip,
        ]);

        return res.rows[0];
      } catch (err) {
        throw err;
      }
    });
  }

  /* ================= UPDATE ================= */

  async update(
    id: string,
    dto: UpdateGuestMedicalContactDto,
    user: string,
    ip: string
  ) {
    return this.db.transaction(async (client) => {

      const existingRes = await client.query(
        `SELECT * 
        FROM t_guest_medical_contact 
        WHERE medical_contact_id = $1
        FOR UPDATE`,
        [id]
      );

      if (!existingRes.rowCount) {
        throw new NotFoundException('Medical contact not found');
      }

      const existing = existingRes.rows[0];

      const guestId = dto.guest_id ?? existing.guest_id;
      const serviceId = dto.service_id ?? existing.service_id;

      // Validate guest
      const guest = await client.query(
        `SELECT 1 FROM m_guest 
        WHERE guest_id = $1 AND is_active = TRUE
        FOR UPDATE`,
        [guestId]
      );

      if (!guest.rowCount) {
        throw new NotFoundException('Guest not found');
      }

      // Validate service
      const service = await client.query(
        `SELECT 1 FROM m_medical_emergency_service 
        WHERE service_id = $1 AND is_active = TRUE
        FOR UPDATE`,
        [serviceId]
      );

      if (!service.rowCount) {
        throw new NotFoundException('Medical service not found');
      }

      // Prevent duplicate active mapping (excluding self)
      const duplicate = await client.query(
        `
        SELECT 1
        FROM t_guest_medical_contact
        WHERE guest_id = $1
          AND service_id = $2
          AND is_active = TRUE
          AND medical_contact_id <> $3
        FOR UPDATE
        `,
        [guestId, serviceId, id]
      );

      if (duplicate.rowCount > 0) {
        throw new ConflictException(
          'Medical contact already assigned to guest'
        );
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

      fields.push(`updated_at = NOW()`);
      fields.push(`updated_by = $${idx}`);
      values.push(user);
      idx++;

      fields.push(`updated_ip = $${idx}`);
      values.push(ip);
      idx++;

      const sql = `
        UPDATE t_guest_medical_contact
        SET ${fields.join(', ')}
        WHERE medical_contact_id = $${idx}
        RETURNING *;
      `;

      values.push(id);

      const res = await client.query(sql, values);

      return res.rows[0];
    });
  }

  /* ================= DATA TABLE ================= */

  async findByGuest(guestId: string) {
    const sql = `
      SELECT
        gmc.medical_contact_id,
        gmc.guest_id,
        gmc.service_id,
        gmc.is_active,
        gmc.inserted_at,

        s.service_provider_name,
        s.service_type,
        s.mobile,
        s.alternate_mobile,
        s.email,

        md.designation_name AS guest_designation,
        gd.department AS guest_department

      FROM t_guest_medical_contact gmc

      JOIN m_medical_emergency_service s
        ON s.service_id = gmc.service_id

      LEFT JOIN t_guest_designation gd
        ON gd.guest_id = gmc.guest_id
      AND gd.is_current = TRUE
      AND gd.is_active = TRUE

      LEFT JOIN m_guest_designation md
        ON md.designation_id = gd.designation_id
      AND md.is_active = TRUE

      WHERE gmc.guest_id = $1
      ORDER BY gmc.inserted_at DESC
    `;

    // const sql = `
    //   SELECT
    //     gmc.medical_contact_id,
    //     gmc.guest_id,
    //     gmc.service_id,
    //     gmc.is_active,
    //     gmc.inserted_at,

    //     s.service_provider_name,
    //     s.service_type,
    //     s.mobile,
    //     s.alternate_mobile,
    //     s.email

    //   FROM t_guest_medical_contact gmc
    //   JOIN m_medical_emergency_service s
    //     ON s.service_id = gmc.service_id
    //   WHERE gmc.guest_id = $1
    //   ORDER BY gmc.inserted_at DESC
    // `;

    const res = await this.db.query(sql, [guestId]);

    return res.rows;
  }

  /* ================= SOFT DELETE ================= */

  async softDelete(
    id: string,
    user: string,
    ip: string
  ) {
    return this.db.transaction(async (client) => {

      const existing = await client.query(
        `SELECT 1 
        FROM t_guest_medical_contact 
        WHERE medical_contact_id = $1
        FOR UPDATE`,
        [id]
      );

      if (!existing.rowCount) {
        throw new NotFoundException('Medical contact not found');
      }

      const res = await client.query(
        `
        UPDATE t_guest_medical_contact
        SET is_active = FALSE,
            updated_at = NOW(),
            updated_by = $2,
            updated_ip = $3
        WHERE medical_contact_id = $1
        RETURNING *;
        `,
        [id, user, ip]
      );

      return res.rows[0];
    });
  }
}
