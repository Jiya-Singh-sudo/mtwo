import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateMealDto } from './dto/create-meals.dto';
import { UpdateMealDto } from './dto/update-meals.dto';

@Injectable()
export class MealsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `SELECT * FROM m_food_items WHERE is_active = $1 ORDER BY food_name`
      : `SELECT * FROM m_food_items ORDER BY food_name`;

    const result = await this.db.query(sql, activeOnly ? [true] : []);
    return result.rows;
  }

  async findOneByName(name: string) {
    const sql = `SELECT * FROM m_food_items WHERE food_name = $1`;
    const result = await this.db.query(sql, [name]);
    return result.rows[0];
  }

  async findOneById(id: number) {
    const sql = `SELECT * FROM m_food_items WHERE food_id = $1`;
    const result = await this.db.query(sql, [id]);
    return result.rows[0];
  }

  async create(dto: CreateMealDto, user: string, ip: string) {
    const now = new Date()
      .toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false })
      .replace(',', '');

    const sql = `
      INSERT INTO m_food_items (
        food_name,
        food_desc,
        food_type,
        is_active,
        inserted_at, inserted_by, inserted_ip,
        updated_at, updated_by, updated_ip
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,NULL,NULL,NULL)
      RETURNING *;
    `;

    const params = [
      dto.food_name,
      dto.food_desc ?? null,
      dto.food_type,
      true,
      now,
      user,
      ip,
    ];

    const result = await this.db.query(sql, params);
    return result.rows[0];
  }

  async update(name: string, dto: UpdateMealDto, user: string, ip: string) {
    const existing = await this.findOneByName(name);
    if (!existing) {
      throw new Error(`Meal '${name}' not found`);
    }

    const now = new Date()
      .toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false })
      .replace(',', '');

    const sql = `
      UPDATE m_food_items SET
        food_name = $1,
        food_desc = $2,
        food_type = $3,
        is_active = $4,
        updated_at = $5,
        updated_by = $6,
        updated_ip = $7
      WHERE food_id = $8
      RETURNING *;
    `;

    const params = [
      dto.food_name ?? existing.food_name,
      dto.food_desc ?? existing.food_desc,
      dto.food_type ?? existing.food_type,
      dto.is_active ?? existing.is_active,
      now,
      user,
      ip,
      existing.food_id,
    ];

    const result = await this.db.query(sql, params);
    return result.rows[0];
  }

  async softDelete(name: string, user: string, ip: string) {
    const existing = await this.findOneByName(name);
    if (!existing) {
      throw new Error(`Meal '${name}' not found`);
    }

    const now = new Date().toISOString();

    const sql = `
      UPDATE m_food_items SET
        is_active = false,
        updated_at = $1,
        updated_by = $2,
        updated_ip = $3
      WHERE food_id = $4
      RETURNING *;
    `;

    const params = [now, user, ip, existing.food_id];
    const result = await this.db.query(sql, params);

    return result.rows[0];
  }
}
