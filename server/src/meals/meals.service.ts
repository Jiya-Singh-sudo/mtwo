import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateMealDto } from './dto/create-meals.dto';
import { UpdateMealDto } from './dto/update-meals.dto';
import { ActivityLogService } from '../activity-log/activity-log.service';
@Injectable()
export class MealsService {
  constructor(private readonly db: DatabaseService, private readonly activityLog: ActivityLogService) {}

  async findAll(activeOnly = true) {
    if (typeof activeOnly !== 'boolean') {
      throw new BadRequestException('Invalid activeOnly flag');
    }
    const sql = activeOnly
      ? `SELECT * FROM m_food_items WHERE is_active = $1 ORDER BY food_name`
      : `SELECT * FROM m_food_items ORDER BY food_name`;

    const result = await this.db.query(sql, activeOnly ? [true] : []);
    return result.rows;
  }

  async findOneByName(name: string) {
    if (!name || !name.trim()) {
      throw new BadRequestException('Food name is required');
    }

    if (name.length > 100) {
      throw new BadRequestException('Food name too long');
    }
    const sql = `SELECT * FROM m_food_items WHERE food_name = $1`;
    const result = await this.db.query(sql, [name]);
    if (!result.rowCount) {
      throw new NotFoundException(`Meal '${name}' not found`);
    }
    return result.rows[0];
  }

  async findOneById(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Invalid food ID');
    }
    const sql = `SELECT * FROM m_food_items WHERE food_id = $1`;
    const result = await this.db.query(sql, [id]);
    if (!result.rowCount) {
      throw new NotFoundException(`Meal with ID ${id} not found`);
    }
    return result.rows[0];
  }
  async create(dto: CreateMealDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      try {
        if (!dto.food_name || !dto.food_name.trim()) {
          throw new BadRequestException('Food name is required');
        }

        if (dto.food_name.length > 100) {
          throw new BadRequestException('Food name cannot exceed 100 characters');
        }
        if (dto.food_desc && dto.food_desc.length > 255) {
          throw new BadRequestException('Food description too long');
        }
        const allowedTypes = ['Veg', 'Non-Veg', 'Vegan', 'Dessert', 'Beverage'];
        if (!allowedTypes.includes(dto.food_type)) {
          throw new BadRequestException('Invalid food type');
        }
        const duplicate = await client.query(`
          SELECT 1 FROM m_food_items
          WHERE LOWER(food_name) = LOWER($1)
        `, [dto.food_name.trim()]);
        if (duplicate.rowCount > 0) {
          throw new BadRequestException('Meal already exists');
        }
        const result = await client.query(
          `
          INSERT INTO m_food_items (
            food_name,
            food_desc,
            food_type,
            is_active,
            inserted_at,
            inserted_by,
            inserted_ip
          )
          VALUES ($1, $2, $3, TRUE, NOW(), $4, $5)
          RETURNING *;
          `,
          [
            dto.food_name.trim(),
            dto.food_desc ?? null,
            dto.food_type,
            user,
            ip,
          ]
        );
        await this.activityLog.log({
          message: 'New Meal item created successfully',
          module: 'MEAL',
          action: 'CREATE',
          referenceId: result.rows[0].food_id,
          performedBy: user,
          ipAddress: ip,
        }, client);
        return result.rows[0];

      } catch (err: any) {
        if (err.code === '23505') {
          throw new BadRequestException('Meal already exists');
        }
        throw err;
      }
    });
  }

  async update(name: string, dto: UpdateMealDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      if (!name || !name.trim()) {
        throw new BadRequestException('Meal name is required');
      }
      if (dto.food_name) {
        if (!dto.food_name.trim()) {
          throw new BadRequestException('Food name cannot be empty');
        }
        if (dto.food_name.length > 100) {
          throw new BadRequestException('Food name too long');
        }
      }
      if (dto.food_type) {
        const allowedTypes = ['Veg', 'Non-Veg', 'Vegan', 'Dessert', 'Beverage'];

        if (!allowedTypes.includes(dto.food_type)) {
          throw new BadRequestException('Invalid food type');
        }
      }
      if (dto.food_desc && dto.food_desc.length > 255) {
        throw new BadRequestException('Food description too long');
      }

      const existingRes = await client.query(
        `SELECT * FROM m_food_items WHERE food_name = $1 FOR UPDATE`,
        [name]
      );
      if (!existingRes.rowCount) {
        throw new NotFoundException(`Meal '${name}' not found`);
      }
      const existing = existingRes.rows[0];
      if (dto.food_name && dto.food_name !== existing.food_name) {
        const duplicate = await client.query(`
          SELECT 1 FROM m_food_items
          WHERE LOWER(food_name) = LOWER($1)
            AND food_id <> $2
        `, [dto.food_name, existing.food_id]);

        if (duplicate.rowCount > 0) {
          throw new BadRequestException('Meal name already exists');
        }
      }
      const sql = `
        UPDATE m_food_items SET
          food_name = $1,
          food_desc = $2,
          food_type = $3,
          is_active = $4,
          updated_at = NOW(),
          updated_by = $5,
          updated_ip = $6
        WHERE food_id = $7
        RETURNING *;
      `;

      const params = [
        dto.food_name ?? existing.food_name,
        dto.food_desc ?? existing.food_desc,
        dto.food_type ?? existing.food_type,
        dto.is_active ?? existing.is_active,
        user,
        ip,
        existing.food_id,
      ];
      const result = await client.query(sql, params);
      await this.activityLog.log({
        message: 'Meal item updated successfully',
        module: 'MEAL',
        action: 'UPDATE',
        referenceId: existing.food_id,
        performedBy: user,
        ipAddress: ip,
      }, client);
      return result.rows[0];
    });
  }

  async softDelete(name: string, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      if (!name || !name.trim()) {
        throw new BadRequestException('Meal name required');
      }
      const existingRes = await client.query(
        `SELECT food_id FROM m_food_items WHERE food_name = $1 FOR UPDATE`,
        [name]
      );

      if (!existingRes.rowCount) {
        throw new NotFoundException(`Meal '${name}' not found`);
      }
      const foodId = existingRes.rows[0].food_id;
      const activeCheck = await client.query(`
        SELECT is_active FROM m_food_items WHERE food_id = $1
      `, [foodId]);
      if (!activeCheck.rows[0].is_active) {
        throw new BadRequestException('Meal already inactive');
      }
      const inUse = await client.query(`
        SELECT 1 FROM t_guest_food
        WHERE food_id = $1
          AND is_active = TRUE
        LIMIT 1
      `, [foodId]);

      if (inUse.rowCount > 0) {
        throw new BadRequestException('Cannot delete meal currently assigned to guests');
      }
      const sql = `
        UPDATE m_food_items SET
          is_active = false,
          updated_at = NOW(),
          updated_by = $1,
          updated_ip = $2
        WHERE food_id = $3
        RETURNING *;
      `;
      const params = [user, ip, foodId];
      const result = await client.query(sql, params);
      await this.activityLog.log({
        message: 'Meal item deleted successfully',
        module: 'MEAL',
        action: 'DELETE',
        referenceId: foodId,
        performedBy: user,
        ipAddress: ip,
      }, client);
      return result.rows[0];
    });
  }

  async getTodayGuests() {
    const sql = `
      SELECT
        g.guest_id,
        g.guest_name,
        g.guest_name_local_language,
        g.guest_mobile,

        gi.room_id,
        gi.entry_date,
        gi.entry_time,
        gi.exit_date,
        gi.exit_time,
        gi.status,
        gi.remarks,
        gi.companions,

        md.designation_name,
        md.guest_name_local_language,
        gd.department,

        gb.guest_butler_id,
        gb.butler_id,
        s.full_name AS butler_name,
        s.full_name_local_language AS butler_name_local_language,
        gb.specialrequest,

        gf.guest_food_id,
        mi.food_name,
        mi.food_type,
        gf.delivery_status,
        gf.meal_type,
        gf.plan_date,
        gf.food_stage

      FROM t_guest_inout gi

      JOIN m_guest g
        ON g.guest_id = gi.guest_id
      AND g.is_active = TRUE

      LEFT JOIN t_guest_designation gd
        ON gd.guest_id = g.guest_id
      AND gd.is_current = TRUE
      AND gd.is_active = TRUE

      LEFT JOIN m_guest_designation md
        ON md.designation_id = gd.designation_id
      AND md.is_active = TRUE

      LEFT JOIN t_guest_butler gb
        ON gb.guest_id = g.guest_id
      AND gb.is_active = TRUE

      LEFT JOIN m_butler b
        ON b.butler_id = gb.butler_id AND b.is_active = TRUE
      LEFT JOIN m_staff s
        ON s.staff_id = gb.butler_id AND s.is_active = TRUE

      LEFT JOIN t_guest_food gf
        ON gf.guest_id = g.guest_id
      AND gf.is_active = TRUE
      AND DATE(gf.order_datetime) = CURRENT_DATE

      LEFT JOIN m_food_items mi
        ON mi.food_id = gf.food_id

      WHERE gi.is_active = TRUE
        AND gi.status = 'Entered'
        AND gi.entry_date = CURRENT_DATE

      ORDER BY g.guest_name, gf.order_datetime;
    `;

    const res = await this.db.query(sql);
    return res.rows;
  }
}
