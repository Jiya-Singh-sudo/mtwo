import { Injectable, NotFoundException, ConflictException,} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateMedicalEmergencyServiceDto, UpdateMedicalEmergencyServiceDto,} from './dto/medical-emergency-service.dto';

@Injectable()
export class MedicalEmergencyServiceService {
  constructor(private readonly db: DatabaseService) {}
    private async generateId(client: any): Promise<string> {
        const res = await client.query(`
        SELECT 'MES' || LPAD(nextval('medical_emergency_service_seq')::text, 3, '0') AS id
        `);
        return res.rows[0].id;
    }
    private async generateStaffId(client: any): Promise<string> {
        const res = await client.query(`
        SELECT 'S' || LPAD(nextval('staff_seq')::text,3,'0') AS id
        `);
        return res.rows[0].id;
    }
  /* ================= CREATE ================= */

  async create(
    dto: CreateMedicalEmergencyServiceDto,
    user: string,
    ip: string
  ) {
    return this.db.transaction(async (client) => {
      try {
        const exists = await client.query(
          `SELECT 1 FROM m_medical_emergency_service WHERE service_id = $1`,
          [dto.service_id]
        );

        if (exists.rowCount > 0) {
          throw new ConflictException('Service already exists');
        }
        const staffId = this.generateStaffId(client);
        const serviceId = this.generateId(client);

        /* 1️⃣ Insert into m_staff */
        await client.query(`
          INSERT INTO m_staff (
            staff_id,
            full_name,
            full_name_local_language,
            primary_mobile,
            alternate_mobile,
            email,
            address,
            designation,
            is_active,
            inserted_at,
            inserted_by,
            inserted_ip
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,'Medical Service',TRUE,NOW(),$8,$9)
        `, [
          staffId,
          dto.service_provider_name,
          dto.service_provider_name_local_language ?? null,
          dto.mobile ?? null,
          dto.alternate_mobile ?? null,
          dto.email ?? null,
          dto.address_line ?? null,
          user,
          ip
        ]);

        /* 2️⃣ Insert into service table */
        const res = await client.query(`
          INSERT INTO m_medical_emergency_service (
            service_id,
            staff_id,
            is_active,
            inserted_at,
            inserted_by,
            inserted_ip
          )
          VALUES ($1,$2,TRUE,NOW(),$3,$4)
          RETURNING *;
        `, [
          serviceId,
          staffId,
          user,
          ip
        ]);
        return res.rows[0];
      } catch (err: any) {
        if (err.code === '23505') {
          throw new ConflictException('Service already exists');
        }
        throw err;
      }
    });
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
          s.full_name ILIKE $${idx}
          OR s.primary_mobile ILIKE $${idx}
          OR mes.service_id ILIKE $${idx}
        )
      `);
      values.push(`%${search}%`);
      idx++;
    }

    // if (serviceType) {
    //   where.push(`messervice_type = $${idx}`);
    //   values.push(serviceType);
    //   idx++;
    // }

    if (typeof isActive === 'boolean') {
      where.push(`mes.is_active = $${idx}`);
      values.push(isActive);
      idx++;
    }
    const allowedSorts: Record<string, string> = {
      service_provider_name: 's.full_name',
      inserted_at: 'mes.inserted_at',
    };

    const sortColumn =
      allowedSorts[sortBy ?? 'inserted_at'] ?? allowedSorts.inserted_at;

    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM m_medical_emergency_service mes
      LEFT JOIN m_staff s ON s.staff_id = mes.staff_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    `;

    const dataSql = `
      SELECT
        mes.service_id,
        s.full_name AS service_provider_name,
        s.full_name_local_language,
        s.primary_mobile AS mobile,
        s.alternate_mobile,
        s.email,
        s.address AS address_line,
        mes.is_active,
        mes.inserted_at
      FROM m_medical_emergency_service mes
      LEFT JOIN m_staff s ON s.staff_id = mes.staff_id
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
    user: string,
    ip: string
  ) {
    return this.db.transaction(async (client) => {

      const existingRes = await client.query(
        `SELECT mes.*, s.*
        FROM m_medical_emergency_service mes
        JOIN m_staff s ON s.staff_id = mes.staff_id
        WHERE mes.service_id = $1
        FOR UPDATE`,
        [id]
      );

      if (!existingRes.rowCount) {
        throw new NotFoundException('Service not found');
      }

      const existing = existingRes.rows[0];

      /* 1️⃣ Update staff */
      await client.query(`
        UPDATE m_staff
        SET
          full_name = $1,
          full_name_local_language = $2,
          primary_mobile = $3,
          alternate_mobile = $4,
          email = $5,
          address = $6,
          updated_at = NOW(),
          updated_by = $7,
          updated_ip = $8
        WHERE staff_id = $9
      `, [
        dto.service_provider_name ?? existing.full_name,
        dto.service_provider_name_local_language ?? existing.full_name_local_language,
        dto.mobile ?? existing.primary_mobile,
        dto.alternate_mobile ?? existing.alternate_mobile,
        dto.email ?? existing.email,
        dto.address_line ?? existing.address,
        user,
        ip,
        existing.staff_id
      ]);

      /* 2️⃣ Update service table */
      const res = await client.query(`
        UPDATE m_medical_emergency_service
        SET
          is_active = $1,
          updated_at = NOW(),
          updated_by = $2,
          updated_ip = $3
        WHERE service_id = $4
        RETURNING *;
      `, [
        dto.is_active ?? existing.is_active,
        user,
        ip,
        id
      ]);

      return res.rows[0];
    });
  }

  /* ================= SOFT DELETE ================= */

  async softDelete(id: string, user:string, ip: string) {
    return this.db.transaction(async (client) => {

      const existingRes = await client.query(
        `SELECT service_id, staff_id
        FROM m_medical_emergency_service
        WHERE service_id = $1
        FOR UPDATE`,
        [id]
      );

      if (!existingRes.rowCount) {
        throw new NotFoundException('Service not found');
      }

      const { staff_id } = existingRes.rows[0];

      await client.query(`
        UPDATE m_medical_emergency_service
        SET is_active = FALSE,
            updated_at = NOW(),
            updated_by = $1,
            updated_ip = $2
        WHERE service_id = $3
      `, [user, ip, id]);

      await client.query(`
        UPDATE m_staff
        SET is_active = FALSE,
            updated_at = NOW(),
            updated_by = $1,
            updated_ip = $2
        WHERE staff_id = $3
      `, [user, ip, staff_id]);

      return { message: 'Service deactivated successfully' };
    });
  }
}
