import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateDriverDutyDto } from '../driver-duty/dto/createDriverDuty.dto';
import { UpdateDriverDutyDto } from '../driver-duty/dto/updateDriverDuty.dto';
 
@Injectable()
export class DriverDutyService {
  constructor(private readonly db: DatabaseService) { }
  private getWeekday(date: string): number {
    return new Date(date + 'T00:00:00').getDay();
  }

  private async generateId(client: any): Promise<string> {
    const res = await client.query(`
      SELECT 'DD' || LPAD(nextval('driver_duty_seq')::text, 3, '0') AS id
    `);
    return res.rows[0].id;
  }

  private isPastDate(date: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dutyDate = new Date(date + 'T00:00:00');
    return dutyDate < today;
  }

  async create(dto: CreateDriverDutyDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      try {
        const driverCheck = await client.query(
          `SELECT 1 FROM m_driver WHERE driver_id = $1 AND is_active = true FOR UPDATE`,
          [dto.driver_id]
        );

        if (!driverCheck.rows.length) {
          throw new BadRequestException('Driver is inactive or does not exist');
        }

        if (dto.is_week_off && (dto.duty_in_time || dto.duty_out_time)) {
          throw new BadRequestException('Week off cannot have duty timings');
        }

        const newId = await this.generateId(client);

        const res = await client.query(
          `
          INSERT INTO t_driver_duty (
            duty_id,
            driver_id,
            duty_date,
            shift,
            duty_in_time,
            duty_out_time,
            is_week_off,
            is_active,
            inserted_at,
            inserted_by,
            inserted_ip,
            updated_at,
            updated_by,
            updated_ip
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, true, NOW(), $8, $9, NULL, NULL, NULL
          )
          ON CONFLICT (driver_id, duty_date)
          DO UPDATE SET
            shift = EXCLUDED.shift,
            duty_in_time = EXCLUDED.duty_in_time,
            duty_out_time = EXCLUDED.duty_out_time,
            is_week_off = EXCLUDED.is_week_off,
            is_active = true,
            updated_at = now(),
            updated_by = $8,
            updated_ip = $9
          RETURNING *;
          `,
          [
            newId,
            dto.driver_id,
            dto.duty_date,
            dto.shift,
            dto.duty_in_time ?? null,
            dto.duty_out_time ?? null,
            dto.is_week_off ?? false,
            user,
            ip,
          ],
        );

        const duty = res.rows[0];

        // ===== WEEKLY OFF RULE =====
        if (dto.is_week_off && dto.repeat_weekly) {
          const weekday = this.getWeekday(dto.duty_date);

          await client.query(
            `
            INSERT INTO t_driver_week_off (driver_id, weekday)
            VALUES ($1, $2)
            ON CONFLICT (driver_id, weekday)
            DO UPDATE SET
              is_active = true,
              updated_at = now(),
              updated_by = $3,
              updated_ip = $4
            `,
            [dto.driver_id, weekday, user, ip]
          );
        }
        return duty;
      } catch (err: any) {
        if (err.code === '23503') {
          throw new BadRequestException('Driver no longer exists');
        }
        console.error('UPSERT DRIVER DUTY FAILED', err);
        throw err;
      }
    });
  }

  async update(dutyId: string, dto: UpdateDriverDutyDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      const existingRes = await client.query(
        `SELECT * FROM t_driver_duty WHERE duty_id = $1 FOR UPDATE`,
        [dutyId]
      );

      if (!existingRes.rows.length) {
        throw new NotFoundException('Duty not found');
      }
      const existing = existingRes.rows[0];
      const finalDate = dto.duty_date ?? existing.duty_date;

      if (this.isPastDate(finalDate)) {
        throw new BadRequestException('Past duties cannot be modified');
      }
      const driverCheck = await client.query(
        `SELECT 1 FROM m_driver WHERE driver_id = $1 AND is_active = true FOR UPDATE`,
        [existing.driver_id]
      );

      if (!driverCheck.rows.length) {
        throw new BadRequestException('Driver is inactive or does not exist');
      }
      const inTime = dto.duty_in_time ?? existing.duty_in_time;
      const outTime = dto.duty_out_time ?? existing.duty_out_time;
      const shift = dto.shift ?? existing.shift;
      const isWeekOff = dto.is_week_off ?? existing.is_week_off;
      if (isWeekOff && (inTime || outTime)) {
        throw new BadRequestException(
          'Week off cannot have duty timings'
        );
      }
      const sql = `
        UPDATE t_driver_duty
        SET
          duty_date     = $1,
          shift         = $2,
          duty_in_time  = $3,
          duty_out_time = $4,
          is_week_off   = $5,
          updated_at    = now(),
          updated_by    = $6,
          updated_ip    = $7
        WHERE duty_id = $8
        RETURNING *;
      `;

      const res = await client.query(sql, [
        dto.duty_date ?? existing.duty_date,
        dto.shift ?? existing.shift,
        dto.duty_in_time ?? existing.duty_in_time,
        dto.duty_out_time ?? existing.duty_out_time,
        dto.is_week_off ?? existing.is_week_off,
        user,
        ip,
        dutyId,
      ]);
      const duty = res.rows[0];

      /* ===============================
        HANDLE WEEKLY OFF RULE
      ================================ */
      if (dto.is_week_off && dto.repeat_weekly) {
        const weekday = this.getWeekday(duty.duty_date);

        await client.query(
          `
          INSERT INTO t_driver_week_off (driver_id, weekday)
          VALUES ($1, $2)
          ON CONFLICT (driver_id, weekday)
          DO UPDATE SET
            is_active = true,
            updated_at = now(),
            updated_by = $3,
            updated_ip = $4
          `,
          [existing.driver_id, weekday, user, ip]
        );
      }
      return duty;
      // return res.rows[0];
    });
  }

  async findOne(dutyId: string) {
    return this.db.transaction(async (client) => {
      const res = await client.query(
        `SELECT * FROM t_driver_duty WHERE duty_id = $1`,
        [dutyId],
      );

      if (!res.rows.length) {
        throw new NotFoundException('Duty not found');
      }

      return res.rows[0];
    });
  }

  async findByDateRange(from: string, to: string) {
    return this.db.transaction(async (client) => {
      const sql = `
        SELECT
          drv.driver_id,
          s.full_name AS driver_name,
          s.full_name_local_language,
          s.primary_mobile AS driver_contact,
          drv.driver_license,
          drv.license_expiry_date,
          cal.duty_date::text AS duty_date,
          d.duty_id,
          d.shift,
          d.duty_in_time,
          d.duty_out_time,

          CASE
            WHEN d.is_week_off = true THEN true
            WHEN w.driver_id IS NOT NULL THEN true
            ELSE false
          END AS is_week_off,

          COALESCE(d.is_active, true) AS is_active

        FROM m_driver drv
          JOIN m_staff s ON s.staff_id = drv.staff_id
          AND drv.is_active = true
          AND s.is_active = true

        CROSS JOIN (
          SELECT generate_series(
            $1::date,
            $2::date,
            interval '1 day'
          )::date AS duty_date
        ) cal

        LEFT JOIN t_driver_duty d
          ON d.driver_id = drv.driver_id
        AND d.duty_date = cal.duty_date

        LEFT JOIN t_driver_week_off w
          ON w.driver_id = drv.driver_id
        AND w.weekday = EXTRACT(DOW FROM cal.duty_date)
        AND w.is_active = true

        WHERE drv.is_active = true AND s.is_active = true
        ORDER BY s.full_name, cal.duty_date;
    `;
      const res = await client.query(sql, [from, to]);
      return res.rows;
    });
  }
  async findByDriver(driverId: string, from: string, to: string) {
    return this.db.transaction(async (client) => {
      const res = await client.query(
        `
        SELECT *
        FROM t_driver_duty
        WHERE driver_id = $1
        AND duty_date BETWEEN $2 AND $3
        ORDER BY duty_date
        `,
        [driverId, from, to],
      );

      return res.rows;
    });
  }

  async findDutyForDriverOnDate(driverId: string, date: string) {
    return this.db.transaction(async (client) => {
      const res = await client.query(
        `
        SELECT *
        FROM t_driver_duty
        WHERE driver_id = $1
          AND duty_date = $2
          AND is_active = TRUE
        ORDER BY updated_at DESC
        LIMIT 1
        `,
        [driverId, date]
      );

      return res.rows[0] || null;
    });
  }
}
