import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CreateMedicalEmergencyServiceDto,
  UpdateMedicalEmergencyServiceDto,
} from './dto/medical-emergency-service.dto';

@Injectable()
export class MedicalEmergencyServiceService {
  constructor(private readonly db: DatabaseService) {}

  /* ================= CREATE ================= */

  async create(
    dto: CreateMedicalEmergencyServiceDto,
    user = 'system',
    ip = '0.0.0.0'
  ) {
    await this.db.query('BEGIN');

    try {
      const exists = await this.db.query(
        `SELECT 1 FROM m_medical_emergency_service WHERE service_id = $1`,
        [dto.service_id]
      );

      if (exists.rowCount > 0) {
        throw new ConflictException('Service already exists');
      }

      const sql = `
        INSERT INTO m_medical_emergency_service (
          service_id,
          service_provider_name,
          service_provider_name_local_language,
          service_type,
          mobile,
          alternate_mobile,
          email,
          address_line,
          distance_from_guest_house,
          is_active,
          inserted_by,
          inserted_ip
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        RETURNING *;
      `;

      const res = await this.db.query(sql, [
        dto.service_id,
        dto.service_provider_name,
        dto.service_provider_name_local_language || null,
        dto.service_type,
        dto.mobile,
        dto.alternate_mobile || null,
        dto.email || null,
        dto.address_line || null,
        dto.distance_from_guest_house || null,
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

  async findAllWithFilters(params: {
    page: number;
    limit: number;
    search?: string;
    serviceType?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page, limit, search, serviceType, isActive, sortBy, sortOrder } =
      params;

    const offset = (page - 1) * limit;
    const where: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (search) {
      where.push(`
        (
          service_provider_name ILIKE $${idx}
          OR mobile ILIKE $${idx}
          OR service_id ILIKE $${idx}
        )
      `);
      values.push(`%${search}%`);
      idx++;
    }

    if (serviceType) {
      where.push(`service_type = $${idx}`);
      values.push(serviceType);
      idx++;
    }

    if (typeof isActive === 'boolean') {
      where.push(`is_active = $${idx}`);
      values.push(isActive);
      idx++;
    }

    const allowedSorts: Record<string, string> = {
      service_provider_name: 'service_provider_name',
      service_type: 'service_type',
      inserted_at: 'inserted_at',
    };

    const sortColumn =
      allowedSorts[sortBy ?? 'inserted_at'] ?? allowedSorts.inserted_at;

    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM m_medical_emergency_service
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    `;

    const dataSql = `
      SELECT *
      FROM m_medical_emergency_service
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

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

  /* ================= UPDATE ================= */

  async update(
    id: string,
    dto: UpdateMedicalEmergencyServiceDto,
    user = 'system',
    ip = '0.0.0.0'
  ) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(dto)) {
      if (value === undefined) continue;
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }

    if (fields.length === 0) {
      throw new NotFoundException('No fields to update');
    }

    fields.push(`updated_at = NOW()`);
    fields.push(`updated_by = $${idx}`);
    values.push(user);
    idx++;

    fields.push(`updated_ip = $${idx}`);
    values.push(ip);
    idx++;

    const sql = `
      UPDATE m_medical_emergency_service
      SET ${fields.join(', ')}
      WHERE service_id = $${idx}
      RETURNING *;
    `;

    values.push(id);

    const res = await this.db.query(sql, values);

    if (!res.rowCount) {
      throw new NotFoundException('Service not found');
    }

    return res.rows[0];
  }

  /* ================= SOFT DELETE ================= */

  async softDelete(id: string, user = 'system', ip = '0.0.0.0') {
    const sql = `
      UPDATE m_medical_emergency_service
      SET is_active = FALSE,
          updated_at = NOW(),
          updated_by = $2,
          updated_ip = $3
      WHERE service_id = $1
      RETURNING *;
    `;

    const res = await this.db.query(sql, [id, user, ip]);

    if (!res.rowCount) {
      throw new NotFoundException('Service not found');
    }

    return res.rows[0];
  }
}
