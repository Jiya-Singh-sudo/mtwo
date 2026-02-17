import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateGuestDesignationDto } from './dto/create-guest-designation.dto';

@Injectable()
export class GuestDesignationService {
  constructor(private readonly db: DatabaseService) {}

  // async create(dto: CreateGuestDesignationDto, user: string, ip: string) {
  //   return this.db.transaction(async (client) => {

  //     // upsert m_designation if designation_name provided
  //     if (dto.designation_name) {
  //       await client.query(`
  //         INSERT INTO m_guest_designation (designation_id, designation_name, inserted_by, inserted_ip)
  //         VALUES ($1,$2,$3,$4)
  //         ON CONFLICT (designation_id) DO UPDATE
  //           SET designation_name = EXCLUDED.designation_name,
  //               updated_at = NOW(),
  //               updated_by = EXCLUDED.inserted_by,
  //               updated_ip = EXCLUDED.inserted_ip
  //       `, [dto.designation_id, dto.designation_name, user, ip]);
  //     } else {
  //       // ensure existence or insert placeholder row (so FK doesn't fail)
  //       const check = await client.query('SELECT 1 FROM m_guest_designation WHERE designation_id = $1', [dto.designation_id]);
  //       if (check.rowCount === 0) {
  //         await client.query('INSERT INTO m_guest_designation (designation_id, designation_name, inserted_by, inserted_ip) VALUES ($1,$2,$3,$4)', [dto.designation_id, null, user, ip]);
  //       }
  //     }

  //     // create gd mapping
  //     const gd_id = `GD${Date.now()}`;
  //     const r = await client.query(`
  //       INSERT INTO t_guest_designation (gd_id, guest_id, designation_id, department, organization, office_location, is_current, is_active, inserted_by, inserted_ip)
  //       VALUES ($1,$2,$3,$4,$5,$6, TRUE, TRUE, $7, $8)
  //       RETURNING *;
  //     `, [gd_id, dto.guest_id, dto.designation_id, dto.department || null, dto.organization || null, dto.office_location || null, user, ip]);

  //     return r.rows[0];
  //   });
  // }
  async create(dto: CreateGuestDesignationDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {

      if (dto.designation_name) {
        await client.query(`
          INSERT INTO m_guest_designation (designation_id, designation_name, inserted_by, inserted_ip)
          VALUES ($1,$2,$3,$4)
          ON CONFLICT (designation_id) DO UPDATE
            SET designation_name = EXCLUDED.designation_name,
                updated_at = NOW(),
                updated_by = EXCLUDED.inserted_by,
                updated_ip = EXCLUDED.inserted_ip
        `, [dto.designation_id, dto.designation_name, user, ip]);
      } else {
        const check = await client.query(
          'SELECT 1 FROM m_guest_designation WHERE designation_id = $1 FOR UPDATE',
          [dto.designation_id]
        );

        if (check.rowCount === 0) {
          await client.query(`
            INSERT INTO m_guest_designation (designation_id, designation_name, inserted_by, inserted_ip)
            VALUES ($1,$2,$3,$4)
          `, [dto.designation_id, null, user, ip]);
        }
      }

      const idRes = await client.query(`
        SELECT 'GD' || LPAD(nextval('guest_designation_seq')::text, 5, '0') AS id
      `);
      const gd_id = idRes.rows[0].id;
      await client.query(`
        UPDATE t_guest_designation
        SET is_current = false,
            updated_at = NOW(),
            updated_by = $2,
            updated_ip = $3
        WHERE guest_id = $1
          AND is_current = true
      `, [dto.guest_id, user, ip]);

      const r = await client.query(`
        INSERT INTO t_guest_designation (
          gd_id, guest_id, designation_id,
          department, organization, office_location,
          is_current, is_active,
          inserted_by, inserted_ip
        )
        VALUES ($1,$2,$3,$4,$5,$6, TRUE, TRUE, $7,$8)
        RETURNING *;
      `, [
        gd_id,
        dto.guest_id,
        dto.designation_id,
        dto.department ?? null,
        dto.organization ?? null,
        dto.office_location ?? null,
        user,
        ip
      ]);

      return r.rows[0];
    });
  }
  async update(gd_id: string, dto: any, user: string, ip: string) {
    return this.db.transaction(async (client) => {

      const existing = await client.query(
        `SELECT * FROM t_guest_designation WHERE gd_id = $1 FOR UPDATE`,
        [gd_id]
      );

      if (!existing.rowCount) {
        throw new NotFoundException('Guest designation not found');
      }

      if (dto.designation_name && dto.designation_id) {
        await client.query(`
          INSERT INTO m_guest_designation (designation_id, designation_name, inserted_by, inserted_ip)
          VALUES ($1,$2,$3,$4)
          ON CONFLICT (designation_id) DO UPDATE
          SET designation_name = EXCLUDED.designation_name,
              updated_at = NOW(),
              updated_by = EXCLUDED.inserted_by,
              updated_ip = EXCLUDED.inserted_ip
        `, [dto.designation_id, dto.designation_name, user, ip]);
      }

      const r = await client.query(`
        UPDATE t_guest_designation
        SET designation_id = $1,
            department = $2,
            organization = $3,
            office_location = $4,
            updated_at = NOW(),
            updated_by = $5,
            updated_ip = $6
        WHERE gd_id = $7
        RETURNING *;
      `, [
        dto.designation_id ?? existing.rows[0].designation_id,
        dto.department ?? existing.rows[0].department,
        dto.organization ?? existing.rows[0].organization,
        dto.office_location ?? existing.rows[0].office_location,
        user,
        ip,
        gd_id
      ]);

      return r.rows[0];
    });
  }

  // async update(gd_id: string, dto: any, user: string, ip: string) {
  //   return this.db.transaction(async (client) => {
  //     // allow updating department/org/location and designation_id (and upsert m_designation if name provided)
  //     if (dto.designation_name && dto.designation_id) {
  //       await client.query(`
  //         INSERT INTO m_guest_designation (designation_id, designation_name, inserted_by, inserted_ip)
  //         VALUES ($1,$2,$3,$4)
  //         ON CONFLICT (designation_id) DO UPDATE SET designation_name = EXCLUDED.designation_name, updated_at = NOW()
  //       `, [dto.designation_id, dto.designation_name, user, ip]);
  //     }
  //     const sql = `
  //       UPDATE t_guest_designation
  //       SET designation_id = $1, department = $2, organization = $3, office_location = $4, updated_at = NOW(), updated_by = $5, updated_ip = $6
  //       WHERE gd_id = $7
  //       RETURNING *;
  //     `;
  //     const r = await client.query(sql, [dto.designation_id, dto.department || null, dto.organization || null, dto.office_location || null, user, ip, gd_id]);
  //     return r.rows[0];
  //   });
  // }
}
