import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { ActivityLogService } from 'src/activity-log/activity-log.service';
@Injectable()
export class VehiclesService {
  constructor(private readonly db: DatabaseService, private readonly activityLog: ActivityLogService) { }

  async getVehicleStats() {
    const sql = `
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE is_active = TRUE) AS active,
        COUNT(*) FILTER (WHERE is_active = FALSE) AS inactive
      FROM m_vehicle;
    `;
    const res = await this.db.query(sql);
    return res.rows[0];
  }
  async getVehiclesTable(query: {
        page: number;
        limit: number;
        search?: string;
        status?: string;
        sortBy: string;
        sortOrder: 'asc' | 'desc';
      }) {
        const pageNum = Number(query.page);
        const limitNum = Number(query.limit);
        if (!Number.isInteger(pageNum) || pageNum <= 0) {
          throw new BadRequestException('INVALID_PAGE');
        }
        if (!Number.isInteger(limitNum) || limitNum <= 0) {
          throw new BadRequestException('INVALID_LIMIT');
        }
        if (limitNum > 100) {
          throw new BadRequestException('LIMIT_TOO_LARGE');
        }
        const offset = (pageNum - 1) * limitNum;

        const SORT_MAP: Record<string, string> = {
          vehicle_no: 'v.vehicle_no',
          vehicle_name: 'v.vehicle_name',
          manufacturing: 'v.manufacturing',
          capacity: 'v.capacity',
        };
        if (query.sortBy && !Object.keys(SORT_MAP).includes(query.sortBy)) {
          throw new BadRequestException('INVALID_SORT_FIELD');
        }
    if (query.sortOrder && !['asc', 'desc'].includes(query.sortOrder)) {
      throw new BadRequestException('INVALID_SORT_ORDER');
    }
        const sortColumn = SORT_MAP[query.sortBy] ?? 'v.vehicle_name';
        const sortOrder = query.sortOrder === 'desc' ? 'DESC' : 'ASC';

    const where: string[] = [];
    const params: any[] = [];
    const allowedStatuses = ['ACTIVE', 'INACTIVE', undefined];

    if (!allowedStatuses.includes(query.status as any)) {
      throw new BadRequestException('INVALID_STATUS');
    }
    if (query.search) {
      const normalized = query.search.trim();

      if (!normalized) {
        throw new BadRequestException('INVALID_SEARCH');
      }

      if (normalized.length > 100) {
        throw new BadRequestException('SEARCH_TOO_LONG');
      }

      params.push(`%${normalized}%`);
      where.push(
        `(v.vehicle_no ILIKE $${params.length} OR v.vehicle_name ILIKE $${params.length})`
      );
    }

    if (query.status === 'ACTIVE') {
      where.push('v.is_active = TRUE');
    }

    if (query.status === 'INACTIVE') {
      where.push('v.is_active = FALSE');
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // ✅ DO NOT push limit/offset into params
    const dataParams = [...params, limitNum, offset];

    const dataSql = `
      SELECT *
      FROM m_vehicle v
      ${whereSql}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2};
    `;

    const countSql = `
      SELECT COUNT(*)::int AS count
      FROM m_vehicle v
      ${whereSql};
    `;

    const [dataRes, countRes] = await Promise.all([
      this.db.query(dataSql, dataParams), // search + limit + offset
      this.db.query(countSql, params),    // search only
    ]);

    return {
      data: dataRes.rows,
      totalCount: countRes.rows[0].count,
    };
  }
  async getFleetOverview() {
    const sql = `
      SELECT
        v.vehicle_no,
        v.vehicle_name,
        v.model,
        v.manufacturing,
        v.capacity,
        v.color,

        CASE
          WHEN gv.is_active = TRUE THEN 'ON_DUTY'
          ELSE 'AVAILABLE'
        END AS status,

        gv.location,
        gv.assigned_at,
        gv.released_at,

        g.guest_name,
        g.guest_name_local_language,

        md.designation_name,
        gd.department,

        s.full_name AS driver_name,
        d.driver_license,
        d.license_expiry_date

      FROM m_vehicle v

      LEFT JOIN t_guest_vehicle gv
        ON gv.vehicle_no = v.vehicle_no
      AND gv.is_active = TRUE

      LEFT JOIN m_guest g
        ON g.guest_id = gv.guest_id
      AND g.is_active = TRUE

      LEFT JOIN t_guest_designation gd
        ON gd.guest_id = g.guest_id
      AND gd.is_current = TRUE
      AND gd.is_active = TRUE

      LEFT JOIN m_guest_designation md
        ON md.designation_id = gd.designation_id
      AND md.is_active = TRUE

      LEFT JOIN m_driver d
        ON d.driver_id = gv.driver_id
      AND d.is_active = TRUE
      LEFT JOIN m_staff s
        ON s.staff_id = d.staff_id
      AND s.is_active = TRUE

      WHERE v.is_active = TRUE
      ORDER BY v.vehicle_name;
    `;

    const res = await this.db.query(sql);
    return res.rows;
  }

  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `SELECT * FROM m_vehicle WHERE is_active = $1 ORDER BY vehicle_name`
      : `SELECT * FROM m_vehicle ORDER BY vehicle_name`;

    const result = await this.db.query(sql, activeOnly ? [true] : []);
    return result.rows;
  }

  async findOne(vehicle_no: string) {
    if (!vehicle_no || !vehicle_no.trim()) {
      throw new BadRequestException('Invalid Vehicle No');
    }
    const sql = `SELECT * FROM m_vehicle WHERE vehicle_no = $1`;
    const result = await this.db.query(sql, [vehicle_no]);
    return result.rows[0];
  }

  async create(dto: CreateVehicleDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      const normalizedVehicleNo = dto.vehicle_no.trim().toUpperCase();
      const normalizedVehicleName = dto.vehicle_name.trim();
      const lockRes = await client.query(
        `SELECT 1 FROM m_vehicle WHERE vehicle_no = $1 FOR UPDATE`,
        [normalizedVehicleNo]
      );
      if (!dto.vehicle_no || !dto.vehicle_no.trim()) {
        throw new BadRequestException('Vehicle No is required');
      }
      if (!/^[A-Z0-9\-]+$/.test(normalizedVehicleNo)) {
        throw new BadRequestException('Invalid Vehicle No Format');
      }
      if (!dto.vehicle_name || !dto.vehicle_name.trim()) {
        throw new BadRequestException('Vehicle Name is required');
      }
      if (dto.vehicle_name.length > 100) {
        throw new BadRequestException('Vehicle Name is too long');
      }
      if (dto.model && dto.model.length > 100) {
        throw new BadRequestException('Model is too long');
      }
      if (!Number.isInteger(Number(dto.manufacturing))) {
        throw new BadRequestException('Invalid Manufacturing Year');
      }

      const year = Number(dto.manufacturing);
      if (!Number.isInteger(dto.capacity)) {
        throw new BadRequestException('Invalid Capacity');
      }

      if (dto.capacity < 1 || dto.capacity > 50) {
        throw new BadRequestException('Invalid Capacity Range');
      }
      if (dto.color && dto.color.length > 50) {
        throw new BadRequestException('Color is too long');
      }
      if (lockRes.rowCount > 0) {
        throw new BadRequestException(
          `Vehicle '${normalizedVehicleNo}' already exists`
        );
      }
      const sql = `
            INSERT INTO m_vehicle (
                vehicle_no,
                vehicle_name,
                model,
                manufacturing,
                capacity,
                color,
                is_active,
                inserted_at, inserted_by, inserted_ip,
                updated_at, updated_by, updated_ip
            )
            VALUES ($1,$2,$3,$4,$5,$6,TRUE, NOW(),$7,$8, NULL, NULL, NULL)
            RETURNING *;
      `;

      const params = [
        normalizedVehicleNo,
        normalizedVehicleName,
        dto.model?.trim() ?? null,
        dto.manufacturing,
        dto.capacity,
        dto.color?.trim() ?? null,
        user,
        ip
      ];

      const result = await client.query(sql, params);
      await this.activityLog.log({
        message: 'New vehicle added',
        module: 'VEHICLE',
        action: 'CREATE',
        referenceId: normalizedVehicleNo,
        performedBy: user,
        ipAddress: ip,
      }, client);
      return result.rows[0];
    });
  }

  async update(vehicle_no: string, dto: UpdateVehicleDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      if (!/^[A-Z0-9\-]+$/.test(vehicle_no.toUpperCase())) {
        throw new BadRequestException('Invalid Vehicle No Format');
      }
      if (dto.vehicle_name && !dto.vehicle_name.trim()) {
        throw new BadRequestException('Invalid Vehicle Name');
      }
      if (dto.manufacturing !== undefined) {
        if (!Number.isInteger(Number(dto.manufacturing))) {
          throw new BadRequestException('Invalid Manufacturing Year');
        }
        const year = Number(dto.manufacturing);
        const currentYear = new Date().getFullYear();

        if (year < 1980 || year > currentYear + 1) {
          throw new BadRequestException(
            `Invalid manufacturing year '${year}'`
          );
        }
      }
      if (dto.capacity !== undefined) {
        if (dto.capacity < 1 || dto.capacity > 50) {
          throw new BadRequestException(
            `Invalid vehicle capacity '${dto.capacity}'`
          );
        }
      }
    const existingRes = await client.query(
      `SELECT * FROM m_vehicle WHERE vehicle_no = $1 AND is_active = TRUE FOR UPDATE`,
      [vehicle_no]
    );

    if (!existingRes.rowCount) {
      throw new NotFoundException(`Vehicle '${vehicle_no}' does not exist`);
    }

    const existing = existingRes.rows[0];
      if (dto.is_active === false && existing.is_active === true) {
        const assignmentCheck = await client.query(
          `
          SELECT 1
          FROM t_guest_vehicle
          WHERE vehicle_no = $1
            AND is_active = TRUE
          FOR UPDATE
          `,
          [vehicle_no]
        );

        if (assignmentCheck.rows.length > 0) {
          throw new BadRequestException(
            `Cannot deactivate vehicle '${vehicle_no}' because it is currently assigned`
          );
        }
      }
        const sql = `
            UPDATE m_vehicle SET
                vehicle_name = $1,
                model = $2,
                manufacturing = $3,
                capacity = $4,
                color = $5,
                is_active = $6,
                updated_at = NOW(),
                updated_by = $7,
                updated_ip = $8
            WHERE vehicle_no = $9
            RETURNING *;
        `;
        const params = [
            dto.vehicle_name?.trim() ?? existing.vehicle_name,
            dto.model ?? existing.model,
            dto.manufacturing ?? existing.manufacturing,
            dto.capacity ?? existing.capacity,
            dto.color ?? existing.color,
            dto.is_active ?? existing.is_active,
            user,
            ip,
            vehicle_no
        ];

        const result = await client.query(sql, params);
        await this.activityLog.log({
          message: 'Vehicle details updated',
          module: 'VEHICLE',
          action: 'UPDATE',
          referenceId: vehicle_no,
          performedBy: user,
        ipAddress: ip,
      }, client);
        return result.rows[0];
    });
  }

  async softDelete(vehicle_no: string, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      if (!/^[A-Z0-9\-]+$/.test(vehicle_no.toUpperCase())) {
        throw new BadRequestException('Invalid Vehicle No Format');
      }
      const existingRes = await client.query(
        `SELECT * FROM m_vehicle WHERE vehicle_no = $1 AND is_active = TRUE FOR UPDATE`,
        [vehicle_no]
      );
      if (!existingRes.rowCount) {
        throw new NotFoundException(`Vehicle '${vehicle_no}' does not exist`);
      }
      const assignmentCheck = await client.query(
        `
        SELECT 1
        FROM t_guest_vehicle
        WHERE vehicle_no = $1
          AND is_active = TRUE
        FOR UPDATE
        `,
        [vehicle_no]
      );
      if (assignmentCheck.rows.length > 0) {
        throw new BadRequestException(
          `Cannot deactivate vehicle '${vehicle_no}' because it is currently assigned to an active duty`
        );
      }
      const sql = `
        UPDATE m_vehicle SET
          is_active = FALSE,
          updated_at = NOW(),
          updated_by = $1,
          updated_ip = $2
        WHERE vehicle_no = $3
        RETURNING *;
      `;

      const result = await client.query(sql, [user, ip, vehicle_no]);
      await this.activityLog.log({
        message: 'Vehicle deleted',
        module: 'VEHICLE',
        action: 'DELETE',
        referenceId: vehicle_no,
        performedBy: user,
        ipAddress: ip,
      }, client);
      return result.rows[0];
    });
  }
  async findAssignable() {
      const sql = `
        SELECT
          v.vehicle_no,
          v.vehicle_name,
          v.model,
          v.capacity
        FROM m_vehicle v
        WHERE v.is_active = TRUE
          AND NOT EXISTS (
            SELECT 1
            FROM t_guest_vehicle gv
            WHERE gv.vehicle_no = v.vehicle_no
              AND gv.is_active = TRUE
          )
        ORDER BY v.vehicle_name;
      `;

      const res = await this.db.query(sql);
      return res.rows;
  }
}
