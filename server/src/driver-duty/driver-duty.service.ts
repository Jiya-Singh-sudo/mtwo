import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateDriverDutyDto } from '../driver-duty/dto/createDriverDuty.dto';
import { UpdateDriverDutyDto } from '../driver-duty/dto/updateDriverDuty.dto';

@Injectable()
export class DriverDutyService {
  constructor(private readonly db: DatabaseService) { }
  private getWeekday(date: string): number {
    return new Date(date + 'T00:00:00').getDay();
  }
  private async generateId(): Promise<string> {
    const res = await this.db.query(`
      SELECT duty_id
      FROM t_driver_duty
      ORDER BY CAST(SUBSTRING(duty_id FROM 3) AS INTEGER) DESC
      LIMIT 1
    `);

    if (!res.rows.length) return 'DD001';

    const last = parseInt(res.rows[0].duty_id.replace('DD', ''), 10);
    return `DD${String(last + 1).padStart(3, '0')}`;
  }

  async create(dto: CreateDriverDutyDto) {
    try {
      const res = await this.db.query(
        `
        INSERT INTO t_driver_duty (
          duty_id,
          driver_id,
          duty_date,
          shift,
          duty_in_time,
          duty_out_time,
          is_week_off,
          is_active
        )
        VALUES (
          COALESCE(
            (
              SELECT duty_id
              FROM t_driver_duty
              WHERE driver_id = $1 AND duty_date = $2
            ),
            $3
          ),
          $1, $2, $4, $5, $6, $7, true
        )
        ON CONFLICT (driver_id, duty_date)
        DO UPDATE SET
          shift = EXCLUDED.shift,
          duty_in_time = EXCLUDED.duty_in_time,
          duty_out_time = EXCLUDED.duty_out_time,
          is_week_off = EXCLUDED.is_week_off,
          is_active = true,
          updated_at = now()
        RETURNING *;
        `,
        [
          dto.driver_id,
          dto.duty_date,
          await this.generateId(),
          dto.shift,
          dto.duty_in_time ?? null,
          dto.duty_out_time ?? null,
          dto.is_week_off ?? false,
        ],
      );
    const duty = res.rows[0];

    /* ===============================
      HANDLE WEEKLY OFF RULE
    ================================ */
    if (dto.is_week_off && dto.repeat_weekly) {
      const weekday = this.getWeekday(dto.duty_date);

      await this.db.query(
        `
        INSERT INTO t_driver_week_off (driver_id, weekday)
        VALUES ($1, $2)
        ON CONFLICT (driver_id, weekday)
        DO UPDATE SET
          is_active = true,
          updated_at = now()
        `,
        [dto.driver_id, weekday]
      );
    }

    return duty;
      // return res.rows[0];
    } catch (err) {
      console.error("UPSERT DRIVER DUTY FAILED", err);
      throw err;
      
    }
    
  }

  async update(dutyId: string, dto: UpdateDriverDutyDto) {
    const existing = await this.findOne(dutyId);

    const sql = `
      UPDATE t_driver_duty
      SET
        duty_date     = $1,
        shift         = $2,
        duty_in_time  = $3,
        duty_out_time = $4,
        is_week_off   = $5,
        updated_at    = now()
      WHERE duty_id = $6
      RETURNING *;
    `;

    const res = await this.db.query(sql, [
      dto.duty_date ?? existing.duty_date,
      dto.shift ?? existing.shift,
      dto.duty_in_time ?? existing.duty_in_time,
      dto.duty_out_time ?? existing.duty_out_time,
      dto.is_week_off ?? existing.is_week_off,
      dutyId,
    ]);
    const duty = res.rows[0];

    /* ===============================
      HANDLE WEEKLY OFF RULE
    ================================ */
    if (dto.is_week_off && dto.repeat_weekly) {
      const weekday = this.getWeekday(duty.duty_date);

      await this.db.query(
        `
        INSERT INTO t_driver_week_off (driver_id, weekday)
        VALUES ($1, $2)
        ON CONFLICT (driver_id, weekday)
        DO UPDATE SET
          is_active = true,
          updated_at = now()
        `,
        [existing.driver_id, weekday]
      );
    }

    return duty;
    // return res.rows[0];
    
  }

  async findOne(dutyId: string) {
    const res = await this.db.query(
      `SELECT * FROM t_driver_duty WHERE duty_id = $1`,
      [dutyId],
    );

    if (!res.rows.length) {
      throw new NotFoundException('Duty not found');
    }

    return res.rows[0];
  }

  async findByDateRange(from: string, to: string) {
    const sql = `
      SELECT
        drv.driver_id,
        drv.driver_name,
        cal.duty_date::text AS duty_date,
        d.duty_id,
        d.shift,
        d.duty_in_time,
        d.duty_out_time,

        CASE
          WHEN d.is_week_off = true THEN true
          WHEN w.id IS NOT NULL THEN true
          ELSE false
        END AS is_week_off,

        COALESCE(d.is_active, true) AS is_active

      FROM m_driver drv

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

      WHERE drv.is_active = true
      ORDER BY drv.driver_name, cal.duty_date;
  `;
    const res = await this.db.query(sql, [from, to]);
    return res.rows;
  }

  async findByDriver(driverId: string, from: string, to: string) {
    const res = await this.db.query(
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
  }

  async findDutyForDriverOnDate(driverId: string, date: string) {
    const res = await this.db.query(
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
  }

}
