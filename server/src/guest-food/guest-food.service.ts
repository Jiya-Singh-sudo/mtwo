import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateGuestFoodDto } from "./dto/create-guest-food-dto";
import { UpdateGuestFoodDto } from "./dto/update-guest-food-dto";

@Injectable()
export class GuestFoodService {
  constructor(private readonly db: DatabaseService) {}

  private async generateId(): Promise<string> {
    const sql = `SELECT guest_food_id FROM t_guest_food ORDER BY guest_food_id DESC LIMIT 1`;
    const res = await this.db.query(sql);

    if (res.rows.length === 0) return "GF001";

    const last = res.rows[0].guest_food_id.replace("GF", "");
    const next = (parseInt(last) + 1).toString().padStart(3, "0");

    return "GF" + next;
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
}
