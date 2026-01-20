import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateGuestFoodDto } from "./dto/create-guest-food-dto";
import { UpdateGuestFoodDto } from "./dto/update-guest-food-dto";

@Injectable()
export class GuestFoodService {
  constructor(private readonly db: DatabaseService) { }

  private async generateId(): Promise<string> {
    const sql = `SELECT guest_food_id FROM t_guest_food ORDER BY guest_food_id DESC LIMIT 1`;
    const res = await this.db.query(sql);

    if (res.rows.length === 0) return "GF001";

    const last = res.rows[0].guest_food_id.replace("GF", "");
    const next = (parseInt(last) + 1).toString().padStart(3, "0");

    return "GF" + next;
  }
  async getDashboardStats() {
    const today = new Date().toISOString().split("T")[0];

    const totalGuestsSql = `
      SELECT COUNT(DISTINCT guest_id) AS count
      FROM t_guest_inout
      WHERE is_active = TRUE
        AND status = 'Entered';
    `;

    const mealsServedSql = `
      SELECT COUNT(*) AS count
      FROM t_guest_food
      WHERE delivery_status = 'Delivered'
        AND DATE(order_datetime) = $1;
    `;

    const specialRequestsSql = `
      SELECT COUNT(*) AS count
      FROM t_guest_food
      WHERE request_type != 'Room-Service'
        AND is_active = TRUE;
    `;

    const menuItemsSql = `
      SELECT COUNT(*) AS count
      FROM m_food_items
      WHERE is_active = TRUE;
    `;

    const [
      totalGuests,
      mealsServed,
      specialRequests,
      menuItems
    ] = await Promise.all([
      this.db.query(totalGuestsSql),
      this.db.query(mealsServedSql, [today]),
      this.db.query(specialRequestsSql),
      this.db.query(menuItemsSql)
    ]);

    return {
      totalGuests: Number(totalGuests.rows[0].count),
      mealsServed: Number(mealsServed.rows[0].count),
      specialRequests: Number(specialRequests.rows[0].count),
      menuItems: Number(menuItems.rows[0].count),
    };
  }

  async getTodaySchedule() {
    const meals = [
      { name: "Breakfast", start: "07:00", end: "10:00" },
      { name: "Lunch", start: "12:30", end: "15:00" },
      { name: "Dinner", start: "19:00", end: "22:00" }
    ];

    const result: { meal: string; window: string; data: any[] }[] = [];

    for (const meal of meals) {
      const sql = `
        SELECT
          COUNT(DISTINCT gf.guest_id) AS expected_guests,
          ARRAY_AGG(DISTINCT mi.food_name) AS menu,
          MAX(gf.delivery_status) AS status,
          mi.food_type
        FROM t_guest_food gf
        JOIN m_food_items mi ON mi.food_id = gf.food_id
        WHERE DATE(gf.order_datetime) = CURRENT_DATE
          AND gf.order_datetime::time BETWEEN $1 AND $2
          AND gf.is_active = TRUE
        GROUP BY mi.food_type;
      `;

      const res = await this.db.query(sql, [meal.start, meal.end]);

      result.push({
        meal: meal.name,
        window: `${meal.start} - ${meal.end}`,
        data: res.rows
      });
    }

    return result;
  }



  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `SELECT * FROM t_guest_food WHERE is_active = $1 ORDER BY order_datetime DESC`
      : `SELECT * FROM t_guest_food ORDER BY order_datetime DESC`;

    const res = await this.db.query(sql, activeOnly ? [true] : []);
    return res.rows;
  }

  async findOne(id: string) {
    const sql = `SELECT * FROM t_guest_food WHERE guest_food_id = $1`;
    const res = await this.db.query(sql, [id]);
    return res.rows[0];
  }

  async create(dto: CreateGuestFoodDto, user: string, ip: string) {
    const id = await this.generateId();
    const now = new Date().toISOString();

    const sql = `
      INSERT INTO t_guest_food (
        guest_food_id, guest_id, room_id,
        food_id, quantity,
        request_type, delivery_status,
        order_datetime, delivered_datetime,
        remarks,
        is_active,
        inserted_at, inserted_by, inserted_ip
      )
      VALUES (
        $1,$2,$3,
        $4,$5,
        $6,$7,
        $8,$9,
        $10,
        true,
        $11,$12,$13
      )
      RETURNING *;
    `;

    const params = [
      id,

      dto.guest_id,
      dto.room_id ?? null,

      dto.food_id,
      dto.quantity,

      dto.request_type ?? "Room-Service",
      dto.delivery_status ?? "Requested",

      dto.order_datetime ?? null,
      dto.delivered_datetime ?? null,

      dto.remarks ?? null,

      now,
      user,
      ip
    ];

    const res = await this.db.query(sql, params);
    return res.rows[0];
  }

  async update(id: string, dto: UpdateGuestFoodDto, user: string, ip: string) {
    const existing = await this.findOne(id);
    if (!existing) throw new Error(`Guest Food "${id}" not found`);

    const now = new Date().toISOString();

    const sql = `
      UPDATE t_guest_food SET
        room_id = $1,
        food_id = $2,
        quantity = $3,
        request_type = $4,
        delivery_status = $5,
        order_datetime = $6,
        delivered_datetime = $7,
        remarks = $8,
        is_active = $9,
        updated_at = $10,
        updated_by = $11,
        updated_ip = $12
      WHERE guest_food_id = $13
      RETURNING *;
    `;

    const params = [
      dto.room_id ?? existing.room_id,
      dto.food_id ?? existing.food_id,
      dto.quantity ?? existing.quantity,
      dto.request_type ?? existing.request_type,
      dto.delivery_status ?? existing.delivery_status,
      dto.order_datetime ?? existing.order_datetime,
      dto.delivered_datetime ?? existing.delivered_datetime,
      dto.remarks ?? existing.remarks,
      dto.is_active ?? existing.is_active,
      now,
      user,
      ip,
      id
    ];

    const res = await this.db.query(sql, params);
    return res.rows[0];
  }

  async softDelete(id: string, user: string, ip: string) {
    const now = new Date().toISOString();

    const sql = `
      UPDATE t_guest_food SET
        is_active = false,
        updated_at = $1,
        updated_by = $2,
        updated_ip = $3
      WHERE guest_food_id = $4
      RETURNING *;
    `;

    const res = await this.db.query(sql, [now, user, ip, id]);
    return res.rows[0];
  }
  async getTodayGuestOrders() {
    const sql = `
      SELECT
        g.guest_id,
        g.guest_name,
        gi.room_id,

        gf.guest_food_id,
        mi.food_name,
        mi.food_type,
        gf.delivery_status,

        gb.guest_butler_id,
        b.butler_id,
        b.butler_name,
        gb.specialrequest

      FROM t_guest_inout gi
      JOIN m_guest g
        ON g.guest_id = gi.guest_id
      AND g.is_active = TRUE

      LEFT JOIN t_guest_food gf
        ON gf.guest_id = g.guest_id
      AND gf.is_active = TRUE
      AND DATE(gf.order_datetime) = CURRENT_DATE

      LEFT JOIN m_food_items mi
        ON mi.food_id = gf.food_id

      LEFT JOIN t_guest_butler gb
        ON gb.guest_id = g.guest_id
      AND gb.is_active = TRUE

      LEFT JOIN m_butler b
        ON b.butler_id = gb.butler_id

      WHERE gi.is_active = TRUE
        AND gi.status = 'Entered'

      ORDER BY g.guest_name, gf.order_datetime;
    `;

    const res = await this.db.query(sql);
    return res.rows;
  }
}
