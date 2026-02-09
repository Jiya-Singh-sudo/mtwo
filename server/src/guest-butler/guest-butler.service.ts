import { BadRequestException, Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateGuestButlerDto } from "./dto/create-guest-butler.dto";
import { UpdateGuestButlerDto } from "./dto/update-guest-butler.dto";

@Injectable()
export class GuestButlerService {
  constructor(private readonly db: DatabaseService) {}

  private async generateId(): Promise<string> {
    const sql = `SELECT guest_butler_id FROM t_guest_butler ORDER BY guest_butler_id DESC LIMIT 1`;
    const res = await this.db.query(sql);

    if (res.rows.length === 0) return "GB001";

    const last = res.rows[0].guest_butler_id.replace("GB", "");
    const next = (parseInt(last) + 1).toString().padStart(3, "0");

    return "GB" + next;
  }

  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `SELECT * FROM t_guest_butler WHERE is_active = $1 ORDER BY inserted_at DESC`
      : `SELECT * FROM t_guest_butler ORDER BY inserted_at DESC`;

    const res = await this.db.query(sql, activeOnly ? [true] : []);
    return res.rows;
  }

  async findOne(id: string) {
    const sql = `SELECT * FROM t_guest_butler WHERE guest_butler_id = $1`;
    const res = await this.db.query(sql, [id]);
    return res.rows[0];
  }

  async create(dto: CreateGuestButlerDto, user: string, ip: string) {
    const existingSql = `
      SELECT guest_butler_id
      FROM t_guest_butler
      WHERE guest_id = $1
        AND is_active = TRUE
    `;
    const existingRes = await this.db.query(existingSql, [dto.guest_id]);

    if (existingRes.rows.length > 0) {
      throw new BadRequestException(
        "This guest already has a butler assigned"
      );
    }

    // 🔒 ENFORCE BUTLER CAPACITY (MAX 3)
    const countSql = `
      SELECT COUNT(*) AS count
      FROM t_guest_butler
      WHERE butler_id = $1 AND is_active = TRUE
    `;
    const countRes = await this.db.query(countSql, [dto.butler_id]);

    if (Number(countRes.rows[0].count) >= 3) {
      throw new BadRequestException(
        "Butler already assigned to 3 active guests"
      );
    }

    const id = await this.generateId();
    const now = new Date().toISOString();

    const sql = `
      INSERT INTO t_guest_butler (
        guest_butler_id,
        guest_id,
        butler_id,
        room_id,
        specialrequest,
        is_active,
        inserted_at,
        inserted_by,
        inserted_ip
      )
      VALUES ($1,$2,$3,$4,$5,TRUE,$6,$7,$8)
      RETURNING *;
    `;

    const params = [
      id,
      dto.guest_id,
      dto.butler_id,
      dto.room_id ?? null,
      dto.specialRequest ?? null,
      now,
      user,
      ip,
    ];

    const res = await this.db.query(sql, params);
    return res.rows[0];
  }

  // async create(dto: CreateGuestButlerDto, user: string, ip: string) {
  //   const id = await this.generateId();
  //   const now = new Date().toISOString();

  //   const sql = `
  //     INSERT INTO t_guest_butler(
  //       guest_butler_id,
  //       guest_id, butler_id, room_id,

  //       specialRequest,

  //       is_active,
  //       inserted_at, inserted_by, inserted_ip
  //     )
  //     VALUES (
  //       $1, $2, $3, $4,
  //       $5,
  //       true,
  //       $6, $7, $8
  //     )
  //     RETURNING *;
  //   `;

  //   const params = [
  //     id,

  //     dto.guest_id,
  //     dto.butler_id,
  //     dto.room_id ?? null,

  //     // dto.check_in_date ?? null,
  //     // dto.check_in_time ?? null,
  //     // dto.check_out_date ?? null,
  //     // dto.check_out_time ?? null,

  //     // dto.service_type,
  //     // dto.service_description ?? null,

  //     // dto.service_date ?? null,
  //     // dto.service_time ?? null,

  //     dto.specialRequest ?? null,

  //     now,
  //     user,
  //     ip
  //   ];

  //   const res = await this.db.query(sql, params);
  //   return res.rows[0];
  // }

  // async update(id: string, dto: UpdateGuestButlerDto, user: string, ip: string) {
  //   const existing = await this.findOne(id);
  //   if (!existing) throw new Error(`Guest Butler Entry '${id}' not found`);

  //   const now = new Date().toISOString();

  //   const sql = `
  //     UPDATE t_guest_butler SET
  //       guest_id = $1,
  //       butler_id = $2,
  //       room_id = $3,

  //       specialRequest = $4,
  //       is_active = $5,

  //       updated_at = $6,
  //       updated_by = $7,
  //       updated_ip = $8
  //     WHERE guest_butler_id = $9
  //     RETURNING *;
  //   `;

  //   const params = [
  //     dto.guest_id ?? existing.guest_id,
  //     dto.butler_id ?? existing.butler_id,
  //     dto.room_id ?? existing.room_id,

  //     // dto.check_in_date ?? existing.check_in_date,
  //     // dto.check_in_time ?? existing.check_in_time,
  //     // dto.check_out_date ?? existing.check_out_date,
  //     // dto.check_out_time ?? existing.check_out_time,

  //     // dto.service_type ?? existing.service_type,
  //     // dto.service_description ?? existing.service_description,

  //     // dto.service_date ?? existing.service_date,
  //     // dto.service_time ?? existing.service_time,

  //     dto.specialRequest ?? existing.remarks,
  //     dto.is_active ?? existing.is_active,

  //     now,
  //     user,
  //     ip,

  //     id
  //   ];

  //   const res = await this.db.query(sql, params);
  //   return res.rows[0];
  // }
  async update(id: string, dto: UpdateGuestButlerDto, user: string, ip: string) {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new Error(`Guest-Butler assignment '${id}' not found`);
    }

    const now = new Date().toISOString();

    const sql = `
      UPDATE t_guest_butler
      SET
        specialrequest = $1,
        updated_at = $2,
        updated_by = $3,
        updated_ip = $4
      WHERE guest_butler_id = $5
      RETURNING *;
    `;

    const params = [
      dto.specialRequest ?? existing.specialrequest,
      now,
      user,
      ip,
      id,
    ];

    const res = await this.db.query(sql, params);
    return res.rows[0];
  }

  async softDelete(id: string, user: string, ip: string) {
    const now = new Date().toISOString();

    const sql = `
      UPDATE t_guest_butler SET 
        is_active = false,
        updated_at = $1,
        updated_by = $2,
        updated_ip = $3
      WHERE guest_butler_id = $4
      RETURNING *;
    `;

    const res = await this.db.query(sql, [now, user, ip, id]);
    return res.rows[0];
  }
}
