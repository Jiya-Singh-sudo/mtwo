import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateMealDto } from './dto/create-meals.dto';
import { UpdateMealDto } from './dto/update-meals.dto';

@Injectable()
export class MealsService {
  constructor(private readonly db: DatabaseService) {}
  // private async generateFoodId(): Promise<string> {
  //   const res = await this.db.query(
  //     `SELECT food_id FROM m_food_items ORDER BY food_id DESC LIMIT 1`
  //   );

  //   if (res.rows.length === 0) return "F001";

  //   const last = res.rows[0].food_id.replace("F", "");
  //   return `F${(Number(last) + 1).toString().padStart(3, "0")}`;
  // }

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

//   async create(dto: CreateMealDto, user: string, ip: string) {
//     const now = new Date()
//       .toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false })
//       .replace(',', '');

//     const foodId = await this.generateFoodId();

//     const sql = `
//       INSERT INTO m_food_items (
//         food_id,
//         food_name,
//         food_desc,
//         food_type,
//         is_active,
//         inserted_at, inserted_by, inserted_ip,
//         updated_at, updated_by, updated_ip
//       )
//       VALUES ($1,$2,$3,$4,TRUE,$5,$6,$7,NULL,NULL,NULL)
//       RETURNING *;
//     `;

// const params = [
//   foodId,
//   dto.food_name,
//   dto.food_desc ?? null,
//   dto.food_type,
//   now,
//   user,
//   ip,
// ];


//     const result = await this.db.query(sql, params);
//     return result.rows[0];
//   }
  async create(dto: CreateMealDto, user: string, ip: string) {
    const now = new Date()
      .toLocaleString("en-GB", { timeZone: "Asia/Kolkata", hour12: false })
      .replace(",", "");

    // ✅ 1. Check for existing food by name (because UNIQUE constraint exists)
    const existing = await this.findOneByName(dto.food_name.trim());
    if (existing) {
      return existing; // ⬅️ IMPORTANT: do NOT insert again
    }

    // ✅ 2. Insert without food_id (Postgres generates it)
    const sql = `
      INSERT INTO m_food_items (
        food_name,
        food_desc,
        food_type,
        is_active,
        inserted_at,
        inserted_by,
        inserted_ip
      )
      VALUES ($1, $2, $3, TRUE, $4, $5, $6)
      RETURNING *;
    `;

    const params = [
      dto.food_name.trim(),
      dto.food_desc ?? null,
      dto.food_type,
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
      throw new NotFoundException(`Meal '${name}' not found`);
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
      throw new NotFoundException(`Meal '${name}' not found`);
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
  async getTodayGuests() {
    const sql = `
      SELECT
        g.guest_id,
        g.guest_name,
        gi.room_id,

        gb.guest_butler_id,
        gb.butler_id,
        b.butler_name,
        gb.specialrequest,

        gf.guest_food_id,
        mi.food_name,
        mi.food_type,
        gf.delivery_status

      FROM t_guest_inout gi
      JOIN m_guest g
        ON g.guest_id = gi.guest_id
       AND g.is_active = TRUE

      LEFT JOIN t_guest_butler gb
        ON gb.guest_id = g.guest_id
       AND gb.is_active = TRUE

      LEFT JOIN m_butler b
        ON b.butler_id = gb.butler_id

      LEFT JOIN t_guest_food gf
        ON gf.guest_id = g.guest_id
       AND gf.is_active = TRUE
       AND DATE(gf.order_datetime) = CURRENT_DATE

      LEFT JOIN m_food_items mi
        ON mi.food_id = gf.food_id

      WHERE gi.is_active = TRUE
        AND gi.status = 'Entered'

      ORDER BY g.guest_name, gf.order_datetime;
    `;

    const res = await this.db.query(sql);
    return res.rows;
  }
}
