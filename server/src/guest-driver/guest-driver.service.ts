import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateGuestDriverDto } from "./dto/create-guest-driver.dto";
import { UpdateGuestDriverDto } from "./dto/update-guest-driver.dto";

@Injectable()
export class GuestDriverService {
  constructor(private readonly db: DatabaseService) {}

  private async generateId(): Promise<string> {
    const sql = `SELECT guest_driver_id FROM t_guest_driver ORDER BY guest_driver_id DESC LIMIT 1`;
    const res = await this.db.query(sql);

    if (res.rows.length === 0) return "GD001";

    const last = res.rows[0].guest_driver_id.replace("GD", "");
    const next = (parseInt(last) + 1).toString().padStart(3, "0");

    return "GD" + next;
  }

  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `SELECT * FROM t_guest_driver WHERE is_active = $1 ORDER BY trip_date DESC`
      : `SELECT * FROM t_guest_driver ORDER BY trip_date DESC`;

    const res = await this.db.query(sql, activeOnly ? [true] : []);
    return res.rows;
  }

  async findOne(id: string) {
    const sql = `SELECT * FROM t_guest_driver WHERE guest_driver_id = $1`;
    const res = await this.db.query(sql, [id]);
    return res.rows[0];
  }

  async create(dto: CreateGuestDriverDto, user: string, ip: string) {
    const id = await this.generateId();
    const now = new Date().toISOString();

    const sql = `
      INSERT INTO t_guest_driver(
        guest_driver_id, guest_id, driver_id, vehicle_no, room_id,
        from_location, to_location, pickup_location, drop_location,
        trip_date, start_time, end_time,
        drop_date, drop_time,
        pickup_status, drop_status, trip_status,
        remarks,
        is_active,
        inserted_at, inserted_by, inserted_ip
      )
      VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,
        $10,$11,$12,
        $13,$14,
        $15,$16,$17,
        $18,
        true,
        $19,$20,$21
      )
      RETURNING *;
    `;

    const params = [
      id,
      dto.guest_id,
      dto.driver_id,
      dto.vehicle_no ?? null,
      dto.room_id ?? null,

      dto.from_location ?? null,
      dto.to_location ?? null,
      dto.pickup_location,
      dto.drop_location ?? null,

      dto.trip_date,
      dto.start_time,
      dto.end_time ?? null,

      dto.drop_date ?? null,
      dto.drop_time ?? null,

      dto.pickup_status ?? "Waiting",
      dto.drop_status ?? "Waiting",
      dto.trip_status ?? "Scheduled",

      dto.remarks ?? null,

      now,
      user,
      ip
    ];

    const res = await this.db.query(sql, params);
    return res.rows[0];
  }

  async update(id: string, dto: UpdateGuestDriverDto, user: string, ip: string) {
    const existing = await this.findOne(id);
    if (!existing) throw new Error(`Guest Driver Entry '${id}' not found`);

    const now = new Date().toISOString();

    const sql = `
      UPDATE t_guest_driver SET
        driver_id = $1,
        vehicle_no = $2,
        room_id = $3,

        from_location = $4,
        to_location = $5,
        pickup_location = $6,
        drop_location = $7,

        trip_date = $8,
        start_time = $9,
        end_time = $10,

        drop_date = $11,
        drop_time = $12,

        pickup_status = $13,
        drop_status = $14,
        trip_status = $15,

        remarks = $16,
        is_active = $17,

        updated_at = $18,
        updated_by = $19,
        updated_ip = $20
      WHERE guest_driver_id = $21
      RETURNING *;
    `;

    const params = [
      dto.driver_id ?? existing.driver_id,
      dto.vehicle_no ?? existing.vehicle_no,
      dto.room_id ?? existing.room_id,

      dto.from_location ?? existing.from_location,
      dto.to_location ?? existing.to_location,
      dto.pickup_location ?? existing.pickup_location,
      dto.drop_location ?? existing.drop_location,

      dto.trip_date ?? existing.trip_date,
      dto.start_time ?? existing.start_time,
      dto.end_time ?? existing.end_time,

      dto.drop_date ?? existing.drop_date,
      dto.drop_time ?? existing.drop_time,

      dto.pickup_status ?? existing.pickup_status,
      dto.drop_status ?? existing.drop_status,
      dto.trip_status ?? existing.trip_status,

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
      UPDATE t_guest_driver SET 
        is_active = false,
        updated_at = $1,
        updated_by = $2,
        updated_ip = $3
      WHERE guest_driver_id = $4
      RETURNING *;
    `;

    const res = await this.db.query(sql, [now, user, ip, id]);
    return res.rows[0];
  }
}
