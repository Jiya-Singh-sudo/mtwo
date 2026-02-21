import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateDriverDto } from './dto/createDriver.dto';
import { UpdateDriverDto } from './dto/updateDriver.dto';
import { translate } from '@vitalets/google-translate-api';
import { transliterateToDevanagari } from '../../common/utlis/transliteration.util';

@Injectable()
export class DriversService {
  constructor(private readonly db: DatabaseService) { }
  private async generateDriverId(client: any): Promise<string> {
    const res = await client.query(`
      SELECT 'D' || LPAD(nextval('driver_id_seq')::text, 3, '0') AS id
    `);
    return res.rows[0].id;
  }
  private async generateStaffId(client: any): Promise<string> {
    const res = await client.query(`
      SELECT 'S' || LPAD(nextval('staff_seq')::text,3,'0') AS id
    `);
    return res.rows[0].id;
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
      driver_name: 's.full_name',
      driver_contact: 's.primary_mobile',
      driver_license: 'd.driver_license',
    };

    const sortColumn = SORT_MAP[query.sortBy] ?? 's.full_name';
    const sortOrder = query.sortOrder === 'desc' ? 'DESC' : 'ASC';

    // const where: string[] = ['d.is_active = true'];
    const where: string[] = [];
    const params: any[] = [];

    if (query.search) {
      params.push(`%${query.search}%`);
      where.push(`
        (
          s.full_name ILIKE $${params.length}
          OR s.primary_mobile ILIKE $${params.length}
          OR d.driver_license ILIKE $${params.length}
        )
      `);
    }
    if (!query.status || query.status === 'ACTIVE') {
      where.push('d.is_active = TRUE');
    }

    if (query.status === 'INACTIVE') {
      where.push('d.is_active = FALSE');
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const dataSql = `
      SELECT
        d.driver_id,
        s.full_name AS driver_name,
        s.full_name_local_language,
        s.primary_mobile AS driver_contact,
        s.alternate_mobile AS driver_alternate_mobile,
        s.email AS driver_mail,
        s.address,
        d.driver_license,
        d.license_expiry_date,
        d.is_active
      FROM m_driver d
      JOIN m_staff s ON s.staff_id = d.staff_id
      ${whereSql}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ${query.limit}
      OFFSET ${offset};
    `;

    const countSql = `
      SELECT COUNT(*)::int AS count
      FROM m_driver d
      JOIN m_staff s ON s.staff_id = d.staff_id
      ${whereSql}
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
        s.full_name AS driver_name,
        s.primary_mobile AS driver_contact,
        s.alternate_mobile AS driver_alternate_mobile,
        d.driver_license,
        s.email AS driver_mail,
        d.license_expiry_date
      FROM m_driver d
      JOIN m_staff s ON s.staff_id = d.staff_id
      WHERE d.is_active = TRUE
        AND s.is_active = TRUE
        AND NOT EXISTS (
          SELECT 1
          FROM t_guest_driver gd
          WHERE gd.driver_id = d.driver_id
            AND gd.is_active = TRUE
        )
      ORDER BY s.full_name;
    `;

    const res = await this.db.query(sql);
    return res.rows;
  }

  async getDriverDashboard() {
    const sql = `
    SELECT
      d.driver_id,
      s.full_name AS driver_name,
      s.full_name_local_language,
      s.primary_mobile AS driver_contact,
      s.alternate_mobile AS driver_alternate_mobile,
      d.driver_license,
      s.address,
      s.email AS driver_mail,
      d.license_expiry_date,
      d.is_active,
      s.is_active AS staff_is_active,
      s.staff_id,

      EXISTS (
        SELECT 1
        FROM t_guest_driver gd
        WHERE gd.driver_id = d.driver_id
          AND gd.is_active = TRUE
      ) AS is_assigned,

      CASE
        WHEN EXISTS (
          SELECT 1
          FROM t_guest_driver gd
          WHERE gd.driver_id = d.driver_id
            AND gd.is_active = TRUE
        )
        THEN 'On Duty'
        ELSE 'Available'
      END AS duty_status,

      (
        SELECT g.guest_name,
              g.guest_name_local_language,
              g.guest_mobile,
              g.guest_alternate_mobile,
              g.guest_mail,
              g.guest_address,
              g.requires_driver
        FROM t_guest_driver gd
        JOIN m_guest g ON g.guest_id = gd.guest_id
        WHERE gd.driver_id = d.driver_id
          AND gd.is_active = TRUE
        LIMIT 1
      ) AS guest_details,

      gd_data.pickup_location,
      gd_data.drop_location,
      gd_data.remarks

      FROM m_driver d
      JOIN m_staff s ON s.staff_id = d.staff_id AND s.is_active = TRUE

      LEFT JOIN LATERAL (
          SELECT
            gd.guest_id,
            gd.pickup_location,
            gd.drop_location,
            gd.remarks
          FROM t_guest_driver gd
          JOIN m_guest g ON g.guest_id = gd.guest_id
          WHERE gd.driver_id = d.driver_id
            AND gd.is_active = TRUE
          LIMIT 1
        ) gd_data ON true
    WHERE d.is_active = TRUE
    ORDER BY s.full_name;
  `;

    const res = await this.db.query(sql);
    return res.rows;
  }

  async create(dto: CreateDriverDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      const driver_name_local_language = transliterateToDevanagari(dto.driver_name);
      const driverName = dto.driver_name?.trim();
      const driverId = await this.generateDriverId(client);
      const staffId = await this.generateStaffId(client);
      const license = dto.driver_license?.trim();
      if (license) {
        const exists = await client.query(
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
      // 1️⃣ Insert into m_staff
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
        VALUES ($1,$2,$3,$4,$5,$6,$7,'Driver',true,NOW(),$8,$9)
      `, [
        staffId,
        dto.driver_name,
        driver_name_local_language,
        dto.driver_contact ?? null,
        dto.driver_alternate_contact ?? null,
        dto.driver_mail ?? null,
        dto.address ?? null,
        user,
        ip
      ]);

      // 2️⃣ Insert into m_driver
      const res = await client.query(`
        INSERT INTO m_driver (
          driver_id,
          staff_id,
          driver_license,
          license_expiry_date,
          is_active,
          inserted_at,
          inserted_by,
          inserted_ip
        )
        VALUES ($1,$2,$3,$4,true,NOW(),$5,$6)
        RETURNING *;
      `, [
        driverId,
        staffId,
        license,
        dto.license_expiry_date ?? null,
        user,
        ip
      ]);

      return res.rows[0];
    });
  }

  async assignDriver(
    payload: { guest_vehicle_id: string; driver_id: string },
    user: string,
    ip: string
  ) {
    return this.db.transaction(async (client) => {
      const driverRes = await client.query(
        `SELECT * FROM m_driver WHERE driver_id = $1 FOR UPDATE`,
        [payload.driver_id]
      );

      const driver = driverRes.rows[0];

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

      const vehicleRes = await client.query(
        `SELECT * FROM t_guest_vehicle WHERE guest_vehicle_id = $1 FOR UPDATE`,
        [payload.guest_vehicle_id]
      );

      if (!vehicleRes.rows.length) {
        throw new BadRequestException('Guest vehicle not found');
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

      const res = await client.query(sql, [
        payload.guest_vehicle_id,
        payload.driver_id,
        user,
        ip
      ]);

      return res.rows[0];
    });
  }

  async findDriversOnDutyByDate(dutyDate: string) {
    const sql = `
      SELECT DISTINCT
        d.driver_id,
        s.full_name AS driver_name,
        s.primary_mobile AS driver_contact
      FROM m_driver d
      JOIN m_staff s ON s.staff_id = d.staff_id
      JOIN t_driver_duty dd ON dd.driver_id = d.driver_id
      WHERE
        d.is_active = TRUE
        AND s.is_active = TRUE
        AND dd.is_active = TRUE
        AND dd.is_week_off = FALSE
        AND dd.duty_date = $1
      ORDER BY s.full_name;
    `;

    const res = await this.db.query(sql, [dutyDate]);
    return res.rows;
  }

  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `
      SELECT d.*, s.full_name
      FROM m_driver d
      JOIN m_staff s ON s.staff_id = d.staff_id
      WHERE d.is_active = $1
      ORDER BY s.full_name
    `
    : `
      SELECT d.*, s.full_name
      FROM m_driver d
      JOIN m_staff s ON s.staff_id = d.staff_id
      ORDER BY s.full_name
    `;
    const result = await this.db.query(sql, activeOnly ? [true] : []);
    return result.rows;
  }

  async findOneByName(driver_name: string) {
    const sql = `
      SELECT d.*, s.*
      FROM m_driver d
      JOIN m_staff s ON s.staff_id = d.staff_id
      WHERE s.full_name = $1
    `;
    const result = await this.db.query(sql, [driver_name]);
    return result.rows[0];
  }

  async findOneById(driver_id: string) {
    const sql = `
      SELECT d.*, s.*
      FROM m_driver d
      JOIN m_staff s ON s.staff_id = d.staff_id
      WHERE d.driver_id = $1
    `;
    const result = await this.db.query(sql, [driver_id]);
    return result.rows[0];
  }

  async update(driver_id: string, dto: UpdateDriverDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {

      const existingRes = await client.query(
        `
        SELECT d.*, s.*
        FROM m_driver d
        JOIN m_staff s ON s.staff_id = d.staff_id
        WHERE d.driver_id = $1
        FOR UPDATE`,
        [driver_id]
      );

      const existing = existingRes.rows[0];

      if (!existing) {
        throw new NotFoundException(`Driver '${driver_id}' not found`);
      }
      const driver_name_local_language = transliterateToDevanagari(dto.driver_name);
      const updatedName = dto.driver_name?.trim();
      const updatedLicense = dto.driver_license?.trim();

      // const now = new Date().toLocaleString('en-GB', {
      //   timeZone: 'Asia/Kolkata',
      //   hour12: false,
      // }).replace(',', '');

      // 🚫 CHECK: Prevent deactivation if driver is assigned
      if (dto.is_active === false && existing.is_active === true) {
        const assignmentCheck = await client.query(`
          SELECT 1
          FROM t_guest_driver
          WHERE driver_id = $1
            AND is_active = TRUE
          LIMIT 1
        `, [driver_id]);

        if (assignmentCheck.rowCount > 0) {
          throw new BadRequestException(
            `Cannot deactivate driver '${driver_id}' because the driver is currently assigned`
          );
        }
      }
      if (dto.driver_license && dto.driver_license !== existing.driver_license) {
        const exists = await client.query(
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
      await client.query(`
        UPDATE m_staff SET
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
        updatedName ?? existing.driver_name,
        driver_name_local_language,
        dto.driver_contact ?? existing.driver_contact,
        dto.driver_alternate_contact ?? existing.driver_alternate_mobile,
        dto.driver_mail ?? existing.driver_mail,
        dto.address ?? existing.address,
        user,
        ip,
        existing.staff_id,
      ]);
      const driverRes = await client.query(`
        UPDATE m_driver SET
          driver_license = $1,
          license_expiry_date = $2,
          is_active = $3,
          updated_at = NOW(),
          updated_by = $4,
          updated_ip = $5
        WHERE driver_id = $6
        RETURNING *;
      `, [
        updatedLicense ?? existing.driver_license,
        dto.license_expiry_date ?? existing.license_expiry_date,
        dto.is_active ?? existing.is_active,
        user,
        ip,
        driver_id,
      ]);

      return driverRes.rows[0];
    });
  }

  async softDelete(driver_id: string, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      const existingRes = await client.query(
        `SELECT * FROM m_driver WHERE driver_id = $1 FOR UPDATE`,
        [driver_id]
      );

      const existing = existingRes.rows[0];

      if (!existing) {
        throw new NotFoundException(`Driver '${driver_id}' not found`);
      }

      // 🚫 CHECK: Is driver currently assigned?
      const assignmentCheck = await client.query(
        `
          SELECT 1
          FROM t_guest_driver
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
      await client.query(`
        UPDATE m_staff SET
          is_active = FALSE,
          updated_at = NOW(),
          updated_by = $1,
          updated_ip = $2
        WHERE staff_id = $3
      `, [user, ip, existing.staff_id]);

      const sql = `
        UPDATE m_driver SET
          is_active = FALSE,
          updated_at = NOW(),
          updated_by = $1,
          updated_ip = $2
        WHERE driver_id = $3
        RETURNING *;
      `;

      const result = await client.query(sql, [user, ip, driver_id]);
      return result.rows[0];
    });
  }
}
