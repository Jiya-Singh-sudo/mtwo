import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateButlerDto } from './dto/create-butler.dto';
import { UpdateButlerDto } from './dto/update-butler.dto';
import { transliterateToDevanagari } from '../../common/utlis/transliteration.util';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class ButlersService {
  constructor(private readonly db: DatabaseService, private readonly activityLog: ActivityLogService) {}
  private async generateButlerId(client: any): Promise<string> {
    const sql = `SELECT 'B' || LPAD(nextval('butler_id_seq')::text, 3, '0') AS butler_id`;
    const result = await client.query(sql);
    return result.rows[0].butler_id;
  }
  private async generateStaffId(client: any): Promise<string> {
    const res = await client.query(`
      SELECT 'S' || LPAD(nextval('staff_seq')::text,3,'0') AS id
    `);
    return res.rows[0].id;
  }
  async getTable(query: any) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "butler_name",
      sortOrder = "asc",
      status,
    } = query;
    if (!Number.isInteger(Number(page)) || Number(page) <= 0) {
      throw new ConflictException('Page must be a positive integer');
    }

    if (!Number.isInteger(Number(limit)) || Number(limit) <= 0) {
      throw new ConflictException('Limit must be a positive integer');
    }

    if (Number(limit) > 100) {
      throw new ConflictException('Limit cannot exceed 100');
    }
    const offset = (page - 1) * limit;

    const SORT_MAP: Record<string, string> = {
      butler_id: "b.butler_id",
      butler_name: "s.full_name",
      shift: "b.shift",
      is_active: "b.is_active",
      inserted_at: "b.inserted_at",
    };

    const orderColumn = SORT_MAP[sortBy] ?? SORT_MAP.butler_name;
    const orderDir = sortOrder === "desc" ? "DESC" : "ASC";

    const where: string[] = [];
    const params: any[] = [];
    if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
      throw new ConflictException('Invalid sort order');
    }
    if (sortBy && !Object.keys(SORT_MAP).includes(sortBy)) {
      throw new ConflictException('Invalid sort column');
    } 
    const allowedStatuses = ['all', 'active', 'inactive'] as const;

    const normalizedStatus = status ?? 'all';

    if (!allowedStatuses.includes(normalizedStatus)) {
      throw new ConflictException('Invalid status filter');
    }
    if (search && search.length > 100) {
      throw new ConflictException('Search text too long');
    }
    if (search) {
      params.push(`%${search}%`);
      where.push(
        `(s.full_name ILIKE $${params.length} OR b.butler_id ILIKE $${params.length})`
      );
    }

    if (normalizedStatus === 'active') {
      where.push('b.is_active = true');
    }

    if (normalizedStatus === 'inactive') {
      where.push('b.is_active = false');
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // ---------- DATA ----------
    const dataSql = `
      SELECT
        b.butler_id,
        s.full_name AS butler_name,
        s.full_name_local_language AS butler_name_local_language,
        b.is_active,
        s.primary_mobile AS butler_mobile,
        s.alternate_mobile AS butler_alternate_mobile,
        b.shift,
        b.inserted_at,
        b.inserted_by,
        b.inserted_ip,
        b.updated_at,
        b.updated_by,
        b.updated_ip
      FROM m_butler b
      JOIN m_staff s ON s.staff_id = b.staff_id
      ${whereSql}
      ORDER BY ${orderColumn} ${orderDir}
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2};
    `;
// const pageNum = Number(page);
// const limitNum = Number(limit);
// const offset = (pageNum - 1) * limitNum;

    const data = await this.db.query(dataSql, [
      ...params,
      limit,
      offset,
    ]);

    // ---------- COUNT ----------
    const countSql = `
      SELECT COUNT(*) AS count
      FROM m_butler b
      ${whereSql};
    `;

    const count = await this.db.query(countSql, params);

    return {
      data: data.rows,
      totalCount: Number(count.rows[0].count),
    };
  }

  async findAll(activeOnly = true) {
    return this.db.transaction(async (client) => {
      if (typeof activeOnly !== 'boolean') {
        throw new ConflictException('Invalid activeOnly flag');
      }
      const sql = activeOnly
        ? `SELECT 
            b.butler_id,
            s.full_name,
            s.full_name_local_language,
            s.primary_mobile,
            s.alternate_mobile,
            b.shift,
            b.is_active
          FROM m_butler b
          JOIN m_staff s ON s.staff_id = b.staff_id
          WHERE b.is_active = $1 AND s.is_active = $1 AND s.designation = 'Butler'
          ORDER BY s.full_name`
        : `SELECT 
            b.butler_id,
            s.full_name,
            s.full_name_local_language,
            s.primary_mobile,
            s.alternate_mobile,
            b.shift,
            b.is_active
          FROM m_butler b
          JOIN m_staff s ON s.staff_id = b.staff_id
          WHERE s.designation = 'Butler'
          ORDER BY s.full_name`;

      const result = await client.query(sql, activeOnly ? [true] : []);
      return result.rows;
    });
  }

  async findOneById(id: string) {
    return this.db.transaction(async (client) => {
      // if (!/^B\d+$/.test(id)) {
      //   throw new ConflictException('Invalid Butler ID format');
      // }
      const sql = `
            SELECT 
              b.butler_id,
              b.shift,
              b.is_active,
              s.staff_id,
              s.full_name,
              s.full_name_local_language,
              s.primary_mobile,
              s.alternate_mobile,
            FROM m_butler b
            JOIN m_staff s ON s.staff_id = b.staff_id
            WHERE b.butler_id = $1
            `;
      const result = await client.query(sql, [id]);
      if (!result.rowCount) {
        throw new NotFoundException(`Butler '${id}' not found`);
      }
      return result.rows[0];
    });
  }

  async create(dto: CreateButlerDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      const butlerId = await this.generateButlerId(client);
      const staffId = await this.generateStaffId(client);
      const butler_name_local_language = transliterateToDevanagari(dto.butler_name);
      if (!dto.butler_name || !dto.butler_name.trim()) {
        throw new ConflictException('Butler name is required');
      }
      if (dto.butler_name.length > 100) {
        throw new ConflictException('Butler name cannot exceed 100 characters');
      }
      if (dto.butler_mobile && !/^\d{10}$/.test(dto.butler_mobile)) {
        throw new ConflictException('Invalid primary mobile number');
      }
      if (dto.butler_alternate_mobile && !/^\d{10}$/.test(dto.butler_alternate_mobile)) {
        throw new ConflictException('Invalid alternate mobile number');
      }
      if (
        dto.butler_mobile &&
        dto.butler_alternate_mobile &&
        dto.butler_mobile === dto.butler_alternate_mobile
      ) {
        throw new ConflictException('Primary and alternate mobile cannot be same');
      }
      if (dto.butler_mobile) {
        const mobileExists = await client.query(`
          SELECT 1 FROM m_staff
          WHERE primary_mobile = $1
            AND is_active = TRUE
            AND designation = 'Butler'
          LIMIT 1
        `, [dto.butler_mobile]);

        if (mobileExists.rowCount > 0) {
          throw new ConflictException('Mobile already exists');
        }
      }
      // if (dto.address && dto.address.length > 255) {
      //   throw new ConflictException('Address cannot exceed 255 characters');
      // }
      // if (dto.remarks && dto.remarks.length > 255) {
      //   throw new ConflictException('Remarks cannot exceed 255 characters');
      // }
      // const allowedShifts = ['Morning', 'Evening', 'Night', 'Full Day'];
      // if (!allowedShifts.includes(dto.shift)) {
      //   throw new ConflictException('Invalid shift');
      // }
      // 1️⃣ Insert into m_staff
      await client.query(`
        INSERT INTO m_staff (
          staff_id,
          full_name,
          full_name_local_language,
          primary_mobile,
          alternate_mobile,
          designation,
          is_active,
          inserted_at,
          inserted_by,
          inserted_ip
        )
        VALUES ($1,$2,$3,$4,$5,'Butler',true,NOW(),$6,$7)
      `, [
        staffId,
        dto.butler_name,
        butler_name_local_language,
        dto.butler_mobile ?? null,
        dto.butler_alternate_mobile ?? null,
        user,
        ip
      ]);

      // 2️⃣ Insert into m_butler
      const res = await client.query(`
        INSERT INTO m_butler (
          butler_id,
          staff_id,
          is_active,
          inserted_at,
          inserted_by,
          inserted_ip
        )
        VALUES ($1,$2,true,NOW(),$3,$4)
        RETURNING *;
      `, [
        butlerId,
        staffId,
        // dto.shift,
        // dto.remarks ?? null,
        user,
        ip
      ]);
      await this.activityLog.log({
        message: 'Butler created',
        module: 'BUTLER',
        action: 'CREATE',
        referenceId: butlerId,
        performedBy: user,
        ipAddress: ip,
      }, client);
      return res.rows[0];
    });
  }

  async update(id: string, dto: UpdateButlerDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      // if (!/^B\d+$/.test(id)) {
      //   throw new ConflictException('Invalid Butler ID format');
      // }
      const existingRes = await client.query(`
        SELECT b.*, s.*
        FROM m_butler b
        JOIN m_staff s ON s.staff_id = b.staff_id
        WHERE b.butler_id = $1
          AND b.is_active = TRUE 
          AND s.is_active = TRUE
          AND s.designation = 'Butler'
        FOR UPDATE
      `, [id]);

      if (!existingRes.rowCount) {
        throw new NotFoundException(`Butler '${id}' not found`);
      }

      const existing = existingRes.rows[0];

      const updatedName = dto.butler_name ?? existing.full_name;
      const updatedLocal = dto.butler_name
        ? transliterateToDevanagari(dto.butler_name)
        : existing.full_name_local_language;
      if (dto.butler_name) {
        if (!dto.butler_name.trim()) {
          throw new ConflictException('Butler name cannot be empty');
        }
        if (dto.butler_name.length > 100) {
          throw new ConflictException('Butler name cannot exceed 100 characters');
        }
      }
      if (dto.butler_mobile && !/^\d{10}$/.test(dto.butler_mobile)) {
        throw new ConflictException('Invalid primary mobile number');
      }
      if (dto.butler_alternate_mobile && !/^\d{10}$/.test(dto.butler_alternate_mobile)) {
        throw new ConflictException('Invalid alternate mobile number');
      }
      if (
        dto.butler_mobile &&
        dto.butler_alternate_mobile &&
        dto.butler_mobile === dto.butler_alternate_mobile
      ) {
        throw new ConflictException('Primary and alternate mobile cannot be same');
      }
      if (dto.butler_mobile) {
        const duplicate = await client.query(`
          SELECT 1 FROM m_staff
          WHERE primary_mobile = $1
            AND staff_id <> $2
            AND is_active = TRUE
            AND designation = 'Butler'
          LIMIT 1
        `, [dto.butler_mobile, existing.staff_id]);

        if (duplicate.rowCount > 0) {
          throw new ConflictException('Mobile already exists');
        }
      }
      // if (dto.shift) {
      //   const allowedShifts = ['Morning', 'Evening', 'Night', 'Full Day'];
      //   if (!allowedShifts.includes(dto.shift)) {
      //     throw new ConflictException('Invalid shift');
      //   }
      // }
      // if (dto.remarks && dto.remarks.length > 255) {
      //   throw new ConflictException('Remarks cannot exceed 255 characters');
      // }
      if (dto.is_active === true && existing.is_active === false) {
        const duplicate = await client.query(`
          SELECT 1 FROM m_butler 
          LEFT JOIN m_staff
          WHERE staff_id = $1
            AND is_active = TRUE
            AND designation = 'Butler'
        `, [existing.staff_id]);

        if (duplicate.rowCount > 0) {
          throw new ConflictException('Butler already active');
        }
      }
      // 1️⃣ Update m_staff
      await client.query(`
        UPDATE m_staff SET
          full_name = $1,
          full_name_local_language = $2,
          primary_mobile = $3,
          alternate_mobile = $4,
          updated_at = NOW(),
          updated_by = $5,
          updated_ip = $6
        WHERE staff_id = $7
      `, [
        updatedName,
        updatedLocal,
        dto.butler_mobile ?? existing.primary_mobile,
        dto.butler_alternate_mobile ?? existing.alternate_mobile,
        user,
        ip,
        existing.staff_id
      ]);

      // 2️⃣ Update m_butler
      const res = await client.query(`
        UPDATE m_butler SET
          is_active = $1,
          updated_at = NOW(),
          updated_by = $2,
          updated_ip = $3
        WHERE butler_id = $4
        RETURNING *;
      `, [
        // dto.shift ?? existing.shift,
        dto.is_active ?? existing.is_active,
        user,
        ip,
        id
      ]);
      await this.activityLog.log({
        message: 'Butler created',
        module: 'BUTLER',
        action: 'UPDATE',
        referenceId: id,
        performedBy: user,
        ipAddress: ip,
      }, client);
      return res.rows[0];
    });
  }

  async softDelete(id: string, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      // if (!/^B\d+$/.test(id)) {
      //   throw new ConflictException('Invalid Butler ID format');
      // }
      const existingRes = await client.query(`
        SELECT b.staff_id, b.is_active, s.is_active
        FROM m_butler b
        JOIN m_staff s ON s.staff_id = b.staff_id
        WHERE b.butler_id = $1 
          AND b.is_active = true 
          AND s.is_active = true
        FOR UPDATE
      `, [id]);
      if (!existingRes.rowCount) {
        throw new NotFoundException(`Butler '${id}' not found`);
      }
      if (!existingRes.rows[0].is_active) {
        throw new ConflictException('Butler already inactive');
      }
      const { staff_id } = existingRes.rows[0];

      await client.query(`
        UPDATE m_butler
        SET is_active = false,
            updated_at = NOW(),
            updated_by = $1,
            updated_ip = $2
        WHERE butler_id = $3
      `, [user, ip, id]);

      await client.query(`
        UPDATE m_staff
        SET is_active = false,
            updated_at = NOW(),
            updated_by = $1,
            updated_ip = $2
        WHERE staff_id = $3
      `, [user, ip, staff_id]);
      await this.activityLog.log({
        message: 'Butler deleted',
        module: 'BUTLER',
        action: 'DELETE',
        referenceId: id,
        performedBy: user,
        ipAddress: ip,
      }, client);
      return { message: 'Butler deleted successfully' };
    });
  }
}

