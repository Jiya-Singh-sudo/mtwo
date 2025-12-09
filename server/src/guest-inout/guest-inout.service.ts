import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateGuestInoutDto } from "./dto/create-guest-inout.dto";
import { UpdateGuestInoutDto } from "./dto/update-guest-inout.dto";

@Injectable()
export class GuestInoutService {
  constructor(private readonly db: DatabaseService) {}

  private async generateId(): Promise<string> {
    const sql = `SELECT inout_id FROM t_guest_inout ORDER BY inout_id DESC LIMIT 1`;
    const res = await this.db.query(sql);

    if (res.rows.length === 0) return "GI001";

    const last = res.rows[0].inout_id.replace("GI", "");
    const next = (parseInt(last) + 1).toString().padStart(3, "0");

    return "GI" + next;
  }

  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `SELECT * FROM t_guest_inout WHERE is_active = $1 ORDER BY entry_date DESC, entry_time DESC`
      : `SELECT * FROM t_guest_inout ORDER BY entry_date DESC, entry_time DESC`;

    const res = await this.db.query(sql, activeOnly ? [true] : []);
    return res.rows;
  }

  async findOne(id: string) {
    const sql = `SELECT * FROM t_guest_inout WHERE inout_id = $1`;
    const res = await this.db.query(sql, [id]);
    return res.rows[0];
  }

  async create(dto: CreateGuestInoutDto, user: string, ip: string) {
    const id = await this.generateId();
    const now = new Date().toISOString();

    const sql = `
      INSERT INTO t_guest_inout(
        inout_id,
        guest_id, room_id, guest_inout,
        entry_date, entry_time,
        exit_date, exit_time,
        status, purpose, remarks,
        is_active,
        inserted_at, inserted_by, inserted_ip
      )
      VALUES (
        $1,$2,$3,$4,
        $5,$6,
        $7,$8,
        $9,$10,$11,
        true,
        $12,$13,$14
      ) RETURNING *;
    `;

    const params = [
      id,

      dto.guest_id,
      dto.room_id ?? null,

      dto.guest_inout ?? null,
      dto.entry_date,
      dto.entry_time,

      dto.exit_date ?? null,
      dto.exit_time ?? null,

      dto.status ?? "Inside",
      dto.purpose ?? null,
      dto.remarks ?? null,

      now,
      user,
      ip
    ];

    const res = await this.db.query(sql, params);
    return res.rows[0];
  }

  async update(id: string, dto: UpdateGuestInoutDto, user: string, ip: string) {
    const existing = await this.findOne(id);
    if (!existing) throw new Error(`Guest In/Out "${id}" not found`);

    const now = new Date().toISOString();

    const sql = `
      UPDATE t_guest_inout SET
        room_id = $1,
        guest_inout = $2,
        entry_date = $3,
        entry_time = $4,
        exit_date = $5,
        exit_time = $6,
        status = $7,
        purpose = $8,
        remarks = $9,
        is_active = $10,
        updated_at = $11,
        updated_by = $12,
        updated_ip = $13
      WHERE inout_id = $14
      RETURNING *;
    `;

    const params = [
      dto.room_id ?? existing.room_id,
      dto.guest_inout ?? existing.guest_inout,
      dto.entry_date ?? existing.entry_date,
      dto.entry_time ?? existing.entry_time,
      dto.exit_date ?? existing.exit_date,
      dto.exit_time ?? existing.exit_time,
      dto.status ?? existing.status,
      dto.purpose ?? existing.purpose,
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
      UPDATE t_guest_inout SET 
        is_active = false,
        updated_at = $1,
        updated_by = $2,
        updated_ip = $3
      WHERE inout_id = $4
      RETURNING *;
    `;

    const res = await this.db.query(sql, [now, user, ip, id]);
    return res.rows[0];
  }
}
