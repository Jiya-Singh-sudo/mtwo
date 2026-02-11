import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CreateGuestMedicalContactDto,
  UpdateGuestMedicalContactDto,
} from './dto/guest-medical-contact.dto';

@Injectable()
export class GuestMedicalContactService {
  constructor(private readonly db: DatabaseService) {}

  /* ================= CREATE ================= */

  async create(
    dto: CreateGuestMedicalContactDto,
    user = 'system',
    ip = '0.0.0.0'
  ) {
    await this.db.query('BEGIN');

    try {
      // Validate guest exists
      const guest = await this.db.query(
        `SELECT 1 FROM m_guest WHERE guest_id = $1 AND is_active = TRUE`,
        [dto.guest_id]
      );

      if (!guest.rowCount) {
        throw new NotFoundException('Guest not found');
      }

      // Validate service exists
      const service = await this.db.query(
        `SELECT 1 FROM m_medical_emergency_service 
         WHERE service_id = $1 AND is_active = TRUE`,
        [dto.service_id]
      );

      if (!service.rowCount) {
        throw new NotFoundException('Medical service not found');
      }

      // Prevent duplicate active mapping
      const duplicate = await this.db.query(
        `
        SELECT 1 FROM t_guest_medical_contact
        WHERE guest_id = $1
          AND service_id = $2
          AND is_active = TRUE
        `,
        [dto.guest_id, dto.service_id]
      );

      if (duplicate.rowCount > 0) {
        throw new ConflictException(
          'Medical contact already assigned to guest'
        );
      }

      const medical_contact_id = `GMC_${Date.now()}`;

      const insertSql = `
        INSERT INTO t_guest_medical_contact (
          medical_contact_id,
          service_id,
          guest_id,
          is_active,
          inserted_by,
          inserted_ip
        )
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *;
      `;

      const res = await this.db.query(insertSql, [
        medical_contact_id,
        dto.service_id,
        dto.guest_id,
        dto.is_active ?? true,
        user,
        ip,
      ]);

      await this.db.query('COMMIT');
      return res.rows[0];
    } catch (err) {
      await this.db.query('ROLLBACK');
      throw err;
    }
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
        s.email

      FROM t_guest_medical_contact gmc
      JOIN m_medical_emergency_service s
        ON s.service_id = gmc.service_id
      WHERE gmc.guest_id = $1
      ORDER BY gmc.inserted_at DESC
    `;

    const res = await this.db.query(sql, [guestId]);

    return res.rows;
  }

  /* ================= SOFT DELETE ================= */

  async softDelete(
    id: string,
    user = 'system',
    ip = '0.0.0.0'
  ) {
    const sql = `
      UPDATE t_guest_medical_contact
      SET is_active = FALSE,
          updated_at = NOW(),
          updated_by = $2,
          updated_ip = $3
      WHERE medical_contact_id = $1
      RETURNING *;
    `;

    const res = await this.db.query(sql, [id, user, ip]);

    if (!res.rowCount) {
      throw new NotFoundException('Medical contact not found');
    }

    return res.rows[0];
  }
}
