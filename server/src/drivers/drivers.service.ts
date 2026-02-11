import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateDriverDto } from './dto/createDriver.dto';
import { UpdateDriverDto } from './dto/updateDriver.dto';
import { translate } from '@vitalets/google-translate-api';
import { transliterateToDevanagari } from '../../common/utlis/transliteration.util';

@Injectable()
export class DriversService {
  constructor(private readonly db: DatabaseService) { }

  // Generate ID like D001, D002 ...
  private async generateDriverId(): Promise<string> {
    const sql = `SELECT driver_id FROM m_driver ORDER BY driver_id DESC LIMIT 1`;
    const result = await this.db.query(sql);

    if (result.rows.length === 0) {
      return 'D001';
    }

    const lastId = result.rows[0].driver_id; // e.g. 'D015'
    const number = parseInt(lastId.replace('D', '')) + 1;
    return 'D' + number.toString().padStart(3, '0');
  }
  async getDriverStats() {
    const sql = `
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE is_active = TRUE) AS active,
        COUNT(*) FILTER (WHERE is_active = FALSE) AS inactive
      FROM m_driver;
    `;
    const res = await this.db.query(sql);
    return res.rows[0];
  }
  // async getDriversTable(query: {
  //   page: number;
  //   limit: number;
  //   search?: string;
  //   sortBy: string;
  //   sortOrder: 'asc' | 'desc';
  // }) {
  //   const offset = (query.page - 1) * query.limit;

  //   const SORT_MAP: Record<string, string> = {
  //     driver_name: 'd.driver_name',
  //     driver_contact: 'd.driver_contact',
  //     driver_license: 'd.driver_license',
  //   };

  //   const sortColumn = SORT_MAP[query.sortBy] ?? 'd.driver_name';
  //   const sortOrder = query.sortOrder === 'desc' ? 'DESC' : 'ASC';

  //   const where: string[] = ['d.is_active = TRUE'];
  //   const params: any[] = [];

  //   if (query.search) {
  //     params.push(`%${query.search}%`);
  //     where.push(`
  //       (
  //         d.driver_name ILIKE $${params.length}
  //         OR d.driver_contact ILIKE $${params.length}
  //         OR d.driver_license ILIKE $${params.length}
  //       )
  //     `);
  //   }

  //   const whereSql = `WHERE ${where.join(' AND ')}`;

  //   const dataSql = `
  //     SELECT
  //       d.driver_id,
  //       d.driver_name,
  //       d.driver_name_local_language,
  //       d.driver_contact,
  //       d.driver_alternate_mobile,
  //       d.driver_license,
  //       d.address,
  //       d.is_active
  //     FROM m_driver d
  //     ${whereSql}
  //     ORDER BY ${sortColumn} ${sortOrder}
  //     LIMIT ${query.limit}
  //     OFFSET ${offset};
  //   `;

  //   const countSql = `
  //     SELECT COUNT(*)::int AS count
  //     FROM m_driver d
  //     ${whereSql};
  //   `;

  //   const [dataRes, countRes] = await Promise.all([
  //     this.db.query(dataSql, params),
  //     this.db.query(countSql, params),
  //   ]);

  //   return {
  //     data: dataRes.rows,
  //     totalCount: countRes.rows[0].count,
  //   };
  // }
  async getDriversTable(query: {
    page: number;
    limit: number;
    search?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const offset = (query.page - 1) * query.limit;

    const SORT_MAP: Record<string, string> = {
      driver_name: 'd.driver_name',
      driver_contact: 'd.driver_contact',
      driver_license: 'd.driver_license',
    };

    const sortColumn = SORT_MAP[query.sortBy] ?? 'd.driver_name';
    const sortOrder = query.sortOrder === 'desc' ? 'DESC' : 'ASC';

    const where: string[] = [];
    const params: any[] = [];

    if (query.search) {
      params.push(`%${query.search}%`);
      where.push(`
        (
          d.driver_name ILIKE $${params.length}
          OR d.driver_contact ILIKE $${params.length}
          OR d.driver_license ILIKE $${params.length}
        )
      `);
    }

    if (query.status === 'ACTIVE') {
      where.push('d.is_active = TRUE');
    }

    if (query.status === 'INACTIVE') {
      where.push('d.is_active = FALSE');
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const dataSql = `
      SELECT
        d.driver_id,
        d.driver_name,
        d.driver_name_local_language,
        d.driver_contact,
        d.driver_alternate_mobile,
        d.driver_license,
        d.address,
        d.is_active
      FROM m_driver d
      ${whereSql}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ${query.limit}
      OFFSET ${offset};
    `;

    const countSql = `
      SELECT COUNT(*)::int AS count
      FROM m_driver d
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

  async findAssignableDrivers() {
    const sql = `
    SELECT
      d.driver_id,
      d.driver_name,
      d.driver_contact
    FROM m_driver d
    WHERE d.is_active = TRUE
      AND NOT EXISTS (
        SELECT 1
        FROM t_guest_vehicle gv
        WHERE gv.driver_id = d.driver_id
          AND gv.is_active = TRUE
      )
    ORDER BY d.driver_name;
  `;

    const res = await this.db.query(sql);
    return res.rows;
  }

  async getDriverDashboard() {
    const sql = `
    SELECT
      d.driver_id,
      d.driver_name,
      d.driver_name_local_language,
      d.driver_contact,
      d.driver_alternate_mobile,
      d.driver_license,
      d.address,
      d.is_active,

      EXISTS (
        SELECT 1
        FROM t_guest_vehicle gv
        WHERE gv.driver_id = d.driver_id
          AND gv.is_active = TRUE
      ) AS is_assigned,

      CASE
        WHEN EXISTS (
          SELECT 1
          FROM t_guest_vehicle gv
          WHERE gv.driver_id = d.driver_id
            AND gv.is_active = TRUE
        )
        THEN 'On Duty'
        ELSE 'Available'
      END AS duty_status,

      (
        SELECT gv.vehicle_no
        FROM t_guest_vehicle gv
        WHERE gv.driver_id = d.driver_id
          AND gv.is_active = TRUE
        LIMIT 1
      ) AS vehicle_no,

      (
        SELECT g.guest_name
        FROM t_guest_vehicle gv
        JOIN m_guest g ON g.guest_id = gv.guest_id
        WHERE gv.driver_id = d.driver_id
          AND gv.is_active = TRUE
        LIMIT 1
      ) AS guest_name

    FROM m_driver d
    WHERE d.is_active = TRUE
    ORDER BY d.driver_name;
  `;

    const res = await this.db.query(sql);
    return res.rows;
  }

  async create(dto: CreateDriverDto, user: string, ip: string) {
    const driver_name_local_language = transliterateToDevanagari(dto.driver_name);
    const license = dto.driver_license?.trim();
    if (license) {
      const exists = await this.db.query(
        `
        SELECT 1
        FROM m_driver
        WHERE driver_license = $1
          AND is_active = TRUE
        LIMIT 1
        `,
        [license]
      );

      if (exists.rows.length > 0) {
        throw new BadRequestException(
          `Driver with license '${license}' already exists`
        );
      }
    }

    const sql = `
    INSERT INTO m_driver
      (driver_id, driver_name, driver_name_local_language, driver_contact, driver_alternate_mobile, driver_license, address,
       is_active, inserted_by, inserted_ip)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7, TRUE,$8,$9)
    RETURNING driver_id, driver_name;
  `;

    const driverId = await this.generateDriverId();

    const driverName = dto.driver_name?.trim();
    const res = await this.db.query(sql, [
      driverId,
      driverName,
      driver_name_local_language,
      dto.driver_contact,
      dto.driver_alternate_contact,
      license,
      dto.address,
      user,
      ip
    ]);

    return res.rows[0];
  }

  async assignDriver(
    payload: { guest_vehicle_id: string; driver_id: string },
    user: string,
    ip: string
  ) {

    const driver = await this.findOneById(payload.driver_id);

    if (!driver) {
      throw new BadRequestException('Driver not found');
    }

    if (driver.license_expiry_date) {
      const today = new Date();
      const expiry = new Date(driver.license_expiry_date);

      if (expiry < today) {
        throw new BadRequestException(
          `Cannot assign driver '${driver.driver_id}' due to expired license`
        );
      }
    }

    const sql = `
    UPDATE t_guest_vehicle
    SET
      driver_id = $2,
      updated_at = NOW(),
      updated_by = $3,
      updated_ip = $4
    WHERE guest_vehicle_id = $1
      AND is_active = TRUE
    RETURNING *;
  `;

    const res = await this.db.query(sql, [
      payload.guest_vehicle_id,
      payload.driver_id,
      user,
      ip
    ]);

    return res.rows[0];
  }

  async findDriversOnDutyByDate(dutyDate: string) {
    const sql = `
      SELECT DISTINCT
        d.driver_id,
        d.driver_name,
        d.driver_contact
      FROM m_driver d
      JOIN t_driver_duty dd
        ON dd.driver_id = d.driver_id
      WHERE
        d.is_active = TRUE
        AND dd.is_active = TRUE
        AND dd.is_week_off = FALSE
        AND dd.duty_date = $1
      ORDER BY d.driver_name;
    `;

    const res = await this.db.query(sql, [dutyDate]);
    return res.rows;
  }

  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `SELECT * FROM m_driver WHERE is_active = $1 ORDER BY driver_name`
      : `SELECT * FROM m_driver ORDER BY driver_name`;

    const result = await this.db.query(sql, activeOnly ? [true] : []);
    return result.rows;
  }

  async findOneByName(driver_name: string) {
    const sql = `SELECT * FROM m_driver WHERE driver_name = $1`;
    const result = await this.db.query(sql, [driver_name]);
    return result.rows[0];
  }

  async findOneById(driver_id: string) {
    const sql = `SELECT * FROM m_driver WHERE driver_id = $1`;
    const result = await this.db.query(sql, [driver_id]);
    return result.rows[0];
  }

  async update(driver_id: string, dto: UpdateDriverDto, user: string, ip: string) {
    const existing = await this.findOneById(driver_id);
    if (!existing) {
      throw new NotFoundException(`Driver '${driver_id}' not found`);
    }
    const driver_name_local_language = transliterateToDevanagari(dto.driver_name);
    const updatedName = dto.driver_name?.trim();
    const updatedLicense = dto.driver_license?.trim();

    const now = new Date().toLocaleString('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
    }).replace(',', '');

    // 🚫 CHECK: Prevent deactivation if driver is assigned
    if (dto.is_active === false && existing.is_active === true) {
      const assignmentCheck = await this.db.query(
        `
        SELECT 1
        FROM t_guest_vehicle
        WHERE driver_id = $1
          AND is_active = TRUE
        LIMIT 1
        `,
        [driver_id]
      );

      if (assignmentCheck.rows.length > 0) {
        throw new BadRequestException(
          `Cannot deactivate driver '${driver_id}' because the driver is currently assigned`
        );
      }
    }
    if (dto.driver_license && dto.driver_license !== existing.driver_license) {
      const exists = await this.db.query(
        `
        SELECT 1
        FROM m_driver
        WHERE driver_license = $1
          AND driver_id <> $2
          AND is_active = TRUE
        LIMIT 1
        `,
        [dto.driver_license.trim(), driver_id]
      );

      if (exists.rows.length > 0) {
        throw new BadRequestException(
          `Driver with license '${dto.driver_license}' already exists`
        );
      }
    }
    if (dto.is_active === true && existing.license_expiry_date) {
      if (new Date(existing.license_expiry_date) < new Date()) {
        throw new BadRequestException(
          `Cannot activate driver '${driver_id}' with expired license`
        );
      }
    }
    const sql = `
      UPDATE m_driver SET
        driver_name = $1,
        driver_name_local_language = $2,
        driver_contact = $3,
        driver_alternate_mobile = $4,
        driver_license = $5,
        address = $6,
        is_active = $7,
        updated_at = $8,
        updated_by = $9,
        updated_ip = $10
      WHERE driver_id = $11
      RETURNING *;
    `;

    const params = [
      updatedName ?? existing.driver_name,
      driver_name_local_language,
      dto.driver_contact ?? existing.driver_contact,
      dto.driver_alternate_contact ?? existing.driver_alternate_mobile,
      updatedLicense ?? existing.driver_license,
      dto.address ?? existing.address,
      dto.is_active ?? existing.is_active,
      now,
      user,
      ip,
      driver_id,
    ];

    const result = await this.db.query(sql, params);
    return result.rows[0];
  }

  // async softDelete(driver_id: string, user: string, ip: string) {
  //   const existing = await this.findOneById(driver_id);
  //   if (!existing) {
  //     throw new Error(`Driver '${driver_id}' not found`);
  //   }
  //   const now = new Date().toISOString();

  //   const sql = `
  //     UPDATE m_driver SET
  //       is_active = false,
  //       updated_at = $1,
  //       updated_by = $2,
  //       updated_ip = $3
  //     WHERE driver_id = $4
  //     RETURNING *;
  //   `;

  //   const result = await this.db.query(sql, [now, user, ip, driver_id]);
  //   return result.rows[0];
  // }

  async softDelete(driver_id: string, user: string, ip: string) {
    const existing = await this.findOneById(driver_id);
    if (!existing) {
      throw new NotFoundException(`Driver '${driver_id}' not found`);
    }

    // 🚫 CHECK: Is driver currently assigned?
    const assignmentCheck = await this.db.query(
      `
      SELECT 1
      FROM t_guest_vehicle
      WHERE driver_id = $1
        AND is_active = TRUE
      LIMIT 1
      `,
      [driver_id]
    );

    if (assignmentCheck.rows.length > 0) {
      throw new BadRequestException(
        `Cannot deactivate driver '${driver_id}' because the driver is currently assigned to an active duty`
      );
    }

    const now = new Date().toISOString();

    const sql = `
      UPDATE m_driver SET
        is_active = FALSE,
        updated_at = $1,
        updated_by = $2,
        updated_ip = $3
      WHERE driver_id = $4
      RETURNING *;
    `;

    const result = await this.db.query(sql, [now, user, ip, driver_id]);
    return result.rows[0];
  }
}
