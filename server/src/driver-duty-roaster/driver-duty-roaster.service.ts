import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateDriverDutyDto } from './dto/createDriverDuty.dto';
import { UpdateDriverDutyDto } from './dto/updateDriverDuty.dto';

@Injectable()
export class DriverDutyRoasterService {
  constructor(private readonly db: DatabaseService) {}

  private async generateId(): Promise<string> {
    const sql = `
      SELECT duty_roaster_id
      FROM t_driver_duty_roaster
      ORDER BY CAST(SUBSTRING(duty_roaster_id FROM 3) AS INTEGER) DESC
      LIMIT 1
    `;
    const res = await this.db.query(sql);

    if (res.rows.length === 0) return 'DR001';

    const last = parseInt(res.rows[0].duty_roaster_id.replace('DR', ''), 10);
    return `DR${(last + 1).toString().padStart(3, '0')}`;
  }

  async findAll() {
    const sql = `SELECT * FROM t_driver_duty_roaster ORDER BY driver_id`;
    const res = await this.db.query(sql);
    return res.rows;
  }

  async findOne(id: string) {
    const sql = `SELECT * FROM t_driver_duty_roaster WHERE duty_roaster_id = $1`;
    const res = await this.db.query(sql, [id]);

    if (!res.rows.length) {
      throw new NotFoundException(`Duty roaster ${id} not found`);
    }
    return res.rows[0];
  }

  async findDriversWithRoaster() {
    const sql = `
      SELECT
        d.driver_id,
        d.driver_name,
        d.is_active AS driver_active,

        r.duty_roaster_id,
        r.is_active AS roaster_active,

        r.monday_duty_in_time,
        r.monday_duty_out_time,
        r.monday_week_off,

        r.tuesday_duty_in_time,
        r.tuesday_duty_out_time,
        r.tuesday_week_off,

        r.wednesday_duty_in_time,
        r.wednesday_duty_out_time,
        r.wednesday_week_off,

        r.thursday_duty_in_time,
        r.thursday_duty_out_time,
        r.thursday_week_off,

        r.friday_duty_in_time,
        r.friday_duty_out_time,
        r.friday_week_off,

        r.saturday_duty_in_time,
        r.saturday_duty_out_time,
        r.saturday_week_off,

        r.sunday_duty_in_time,
        r.sunday_duty_out_time,
        r.sunday_week_off

      FROM m_driver d
      LEFT JOIN t_driver_duty_roaster r
        ON r.driver_id = d.driver_id
      AND r.is_active = true
      WHERE d.is_active = true
      ORDER BY d.driver_id;
    `;

    const res = await this.db.query(sql);
    return res.rows;
  }


  async create(dto: CreateDriverDutyDto) {
    const roasterId = await this.generateId();

    const sql = `
      INSERT INTO t_driver_duty_roaster (
        duty_roaster_id,
        driver_id,

        sunday_duty_in_time, sunday_duty_out_time, sunday_week_off, sunday_week_off,
        monday_duty_in_time, monday_duty_out_time, monday_week_off, monday_week_off,
        tuesday_duty_in_time, tuesday_duty_out_time, tuesday_week_off, tuesday_week_off,
        wednesday_duty_in_time, wednesday_duty_out_time, wednesday_week_off, wednesday_week_off,
        thursday_duty_in_time, thursday_duty_out_time, thursday_week_off, thursday_week_off,
        friday_duty_in_time, friday_duty_out_time, friday_week_off, friday_week_off,
        saturday_duty_in_time, saturday_duty_out_time, saturday_week_off, saturday_week_off
      )
      VALUES (
        $1,$2,
        $3,$4,$5,$6,
        $7,$8,$9,$10,
        $11,$12,$13,$14,
        $15,$16,$17,$18,
        $19,$20,$21,$22,
        $23,$24,$25,$26,
        $27,$28,$29,$30
      )
      RETURNING *;
    `;

    const params = [
      roasterId,
      dto.driver_id,

      dto.sunday_duty_in_time, dto.sunday_duty_out_time, dto.sunday_week_off, dto.sunday_week_off,
      dto.monday_duty_in_time, dto.monday_duty_out_time, dto.monday_week_off, dto.monday_week_off,
      dto.tuesday_duty_in_time, dto.tuesday_duty_out_time, dto.tuesday_week_off, dto.tuesday_week_off,
      dto.wednesday_duty_in_time, dto.wednesday_duty_out_time, dto.wednesday_week_off, dto.wednesday_week_off,
      dto.thursday_duty_in_time, dto.thursday_duty_out_time, dto.thursday_week_off, dto.thursday_week_off,
      dto.friday_duty_in_time, dto.friday_duty_out_time, dto.friday_week_off, dto.friday_week_off,
      dto.saturday_duty_in_time, dto.saturday_duty_out_time, dto.saturday_week_off, dto.saturday_week_off,
    ];

    const res = await this.db.query(sql, params);
    return res.rows[0];
  }

  async update(id: string, dto: UpdateDriverDutyDto) {
    const existing = await this.findOne(id);

    const sql = `
      UPDATE t_driver_duty_roaster
      SET
        sunday_duty_in_time = $1,
        sunday_duty_out_time = $2,
        sunday_week_off = $3,
        sunday_week_off = $4,

        monday_duty_in_time = $5,
        monday_duty_out_time = $6,
        monday_week_off = $7,
        monday_week_off = $8,

        tuesday_duty_in_time = $9,
        tuesday_duty_out_time = $10,
        tuesday_week_off = $11,
        tuesday_week_off = $12,

        wednesday_duty_in_time = $13,
        wednesday_duty_out_time = $14,
        wednesday_week_off = $15,
        wednesday_week_off = $16,

        thursday_duty_in_time = $17,
        thursday_duty_out_time = $18,
        thursday_week_off = $19,
        thursday_week_off = $20,

        friday_duty_in_time = $21,
        friday_duty_out_time = $22,
        friday_week_off = $23,
        friday_week_off = $24,

        saturday_duty_in_time = $25,
        saturday_duty_out_time = $26,
        saturday_week_off = $27,
        saturday_week_off = $28
      WHERE duty_roaster_id = $29
      RETURNING *;
    `;

    const res = await this.db.query(sql, [
      dto.sunday_duty_in_time ?? existing.sunday_duty_in_time,
      dto.sunday_duty_out_time ?? existing.sunday_duty_out_time,
      dto.sunday_week_off ?? existing.sunday_week_off,
      dto.sunday_week_off ?? existing.sunday_week_off,

      dto.monday_duty_in_time ?? existing.monday_duty_in_time,
      dto.monday_duty_out_time ?? existing.monday_duty_out_time,
      dto.monday_week_off ?? existing.monday_week_off,
      dto.monday_week_off ?? existing.monday_week_off,

      dto.tuesday_duty_in_time ?? existing.tuesday_duty_in_time,
      dto.tuesday_duty_out_time ?? existing.tuesday_duty_out_time,
      dto.tuesday_week_off ?? existing.tuesday_week_off,
      dto.tuesday_week_off ?? existing.tuesday_week_off,

      dto.wednesday_duty_in_time ?? existing.wednesday_duty_in_time,
      dto.wednesday_duty_out_time ?? existing.wednesday_duty_out_time,
      dto.wednesday_week_off ?? existing.wednesday_week_off,
      dto.wednesday_week_off ?? existing.wednesday_week_off,

      dto.thursday_duty_in_time ?? existing.thursday_duty_in_time,
      dto.thursday_duty_out_time ?? existing.thursday_duty_out_time,
      dto.thursday_week_off ?? existing.thursday_week_off,
      dto.thursday_week_off ?? existing.thursday_week_off,

      dto.friday_duty_in_time ?? existing.friday_duty_in_time,
      dto.friday_duty_out_time ?? existing.friday_duty_out_time,
      dto.friday_week_off ?? existing.friday_week_off,
      dto.friday_week_off ?? existing.friday_week_off,

      dto.saturday_duty_in_time ?? existing.saturday_duty_in_time,
      dto.saturday_duty_out_time ?? existing.saturday_duty_out_time,
      dto.saturday_week_off ?? existing.saturday_week_off,
      dto.saturday_week_off ?? existing.saturday_week_off,

      id,
    ]);

    return res.rows[0];
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.db.query(
      `DELETE FROM t_driver_duty_roaster WHERE duty_roaster_id = $1`,
      [id],
    );
    return { success: true };
  }
}
