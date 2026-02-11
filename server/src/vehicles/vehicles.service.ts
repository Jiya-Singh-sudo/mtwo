import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
    constructor(private readonly db: DatabaseService) {}
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
        const offset = (query.page - 1) * query.limit;

        const SORT_MAP: Record<string, string> = {
          vehicle_no: 'v.vehicle_no',
          vehicle_name: 'v.vehicle_name',
          manufacturing: 'v.manufacturing',
          capacity: 'v.capacity',
        };

        const sortColumn = SORT_MAP[query.sortBy] ?? 'v.vehicle_name';
        const sortOrder = query.sortOrder === 'desc' ? 'DESC' : 'ASC';

        // const where: string[] = [];
        // const params: any[] = [];

        // if (query.search) {
        //   params.push(`%${query.search}%`);
        //   where.push(`(v.vehicle_no ILIKE $${params.length} OR v.vehicle_name ILIKE $${params.length})`);
        // }
        // if (query.status === 'ACTIVE') {
        //   where.push('v.is_active = TRUE');
        // }

        // if (query.status === 'INACTIVE') {
        //   where.push('v.is_active = FALSE');
        // }
        // const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
        const where: string[] = [];
        const params: any[] = [];

        if (query.search) {
          params.push(`%${query.search}%`);
          where.push(`(v.vehicle_no ILIKE $${params.length} OR v.vehicle_name ILIKE $${params.length})`);
        }

        if (query.status === 'ACTIVE') {
          where.push('v.is_active = TRUE');
        }

        if (query.status === 'INACTIVE') {
          where.push('v.is_active = FALSE');
        }

        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

        const dataSql = `
          SELECT *
          FROM m_vehicle v
          ${whereSql}
          ORDER BY ${sortColumn} ${sortOrder}
          LIMIT ${query.limit}
          OFFSET ${offset};
        `;

        const countSql = `
          SELECT COUNT(*)::int AS count
          FROM m_vehicle v
          ${whereSql};
        `;

        const [dataRes, countRes] = await Promise.all([
          this.db.query(dataSql, params),
          this.db.query(countSql, params),
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

            CASE
              WHEN gv.is_active = TRUE THEN 'ON_DUTY'
              ELSE 'AVAILABLE'
            END AS status,

            gv.location,
            g.guest_name,
            d.driver_name

          FROM m_vehicle v
          LEFT JOIN t_guest_vehicle gv
            ON gv.vehicle_no = v.vehicle_no
          AND gv.is_active = TRUE
          LEFT JOIN m_guest g
            ON g.guest_id = gv.guest_id
          LEFT JOIN m_driver d
            ON d.driver_id = gv.driver_id

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
    const sql = `SELECT * FROM m_vehicle WHERE vehicle_no = $1`;
    const result = await this.db.query(sql, [vehicle_no]);
    return result.rows[0];
  }

  async create(dto: CreateVehicleDto, user: string, ip: string) {
    const now = new Date().toLocaleString("en-GB", {
            timeZone: "Asia/Kolkata",
            hour12: false,
        }).replace(",", "");
    // const normalizedVehicleNo = dto.vehicle_no?.trim().toUpperCase();
    // const normalizedVehicleName = dto.vehicle_name?.trim();
    const normalizedVehicleNo = dto.vehicle_no.trim().toUpperCase();
    const normalizedVehicleName = dto.vehicle_name.trim();

    const exists = await this.db.query(
      `
      SELECT 1
      FROM m_vehicle
      WHERE vehicle_no = $1
      LIMIT 1
      `,
      [normalizedVehicleNo]
    );

    if (exists.rows.length > 0) {
      throw new BadRequestException(
        `Vehicle '${normalizedVehicleNo}' already exists`
      );
    }
    if (dto.manufacturing) {
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
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NULL, NULL, NULL)
            RETURNING *;
        `;

        const params = [
            normalizedVehicleNo,
            normalizedVehicleName,
            dto.model?.trim() ?? null,
            dto.manufacturing,
            dto.capacity,
            dto.color?.trim() ?? null,
            true,
            now,
            user,
            ip
        ];

        const result = await this.db.query(sql, params);
        return result.rows[0];
    }

    async update(vehicle_no: string, dto: UpdateVehicleDto, user: string, ip: string) {
        const now = new Date().toLocaleString("en-GB", {
            timeZone: "Asia/Kolkata",
            hour12: false,
        }).replace(",", "");
        // const normalizedVehicleNo = dto.vehicle_no?.trim().toUpperCase();
        // const normalizedVehicleName = dto.vehicle_name?.trim();

        const existing = await this.findOne(vehicle_no);
        if (!existing) {
            throw new NotFoundException(`Vehicle '${vehicle_no}' not found`);
        }
      if (dto.is_active === false && existing.is_active === true) {
        const assignmentCheck = await this.db.query(
          `
          SELECT 1
          FROM t_guest_vehicle
          WHERE vehicle_no = $1
            AND is_active = TRUE
          LIMIT 1
          `,
          [vehicle_no]
        );

        if (assignmentCheck.rows.length > 0) {
          throw new BadRequestException(
            `Cannot deactivate vehicle '${vehicle_no}' because it is currently assigned`
          );
        }
      }
      if (dto.manufacturing) {
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
        const sql = `
            UPDATE m_vehicle SET
                vehicle_name = $1,
                model = $2,
                manufacturing = $3,
                capacity = $4,
                color = $5,
                is_active = $6,
                updated_at = $7,
                updated_by = $8,
                updated_ip = $9
            WHERE vehicle_no = $10
            RETURNING *;
        `;

        const params = [
            dto.vehicle_name?.trim() ?? existing.vehicle_name,,
            dto.model ?? existing.model,
            dto.manufacturing ?? existing.manufacturing,
            dto.capacity ?? existing.capacity,
            dto.color ?? existing.color,
            dto.is_active ?? existing.is_active,
            now,
            user,
            ip,
            vehicle_no
        ];

        const result = await this.db.query(sql, params);
        return result.rows[0];
    }

    // async softDelete(vehicle_no: string, user: string, ip: string) {
    //     const now = new Date().toISOString();

    //     const sql = `
    //         UPDATE m_vehicle SET
    //             is_active = false,
    //             updated_at = $1,
    //             updated_by = $2,
    //             updated_ip = $3
    //         WHERE vehicle_no = $4
    //         RETURNING *;
    //     `;

    //     const result = await this.db.query(sql, [now, user, ip, vehicle_no]);
    //     return result.rows[0];
    // }
  async softDelete(vehicle_no: string, user: string, ip: string) {
    const existing = await this.findOne(vehicle_no);
    if (!existing) {
      throw new NotFoundException(`Vehicle '${vehicle_no}' not found`);
    }

    const assignmentCheck = await this.db.query(
      `
      SELECT 1
      FROM t_guest_vehicle
      WHERE vehicle_no = $1
        AND is_active = TRUE
      LIMIT 1
      `,
      [vehicle_no]
    );

    if (assignmentCheck.rows.length > 0) {
      throw new BadRequestException(
        `Cannot deactivate vehicle '${vehicle_no}' because it is currently assigned to an active duty`
      );
    }

    const now = new Date().toISOString();

    const sql = `
      UPDATE m_vehicle SET
        is_active = FALSE,
        updated_at = $1,
        updated_by = $2,
        updated_ip = $3
      WHERE vehicle_no = $4
      RETURNING *;
    `;

    const result = await this.db.query(sql, [now, user, ip, vehicle_no]);
    return result.rows[0];
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
