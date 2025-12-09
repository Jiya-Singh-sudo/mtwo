import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateGuestRoomDto } from "./dto/create-guest-room.dto";
import { UpdateGuestRoomDto } from "./dto/update-guest-room.dto";

@Injectable()
export class GuestRoomService {
  constructor(private readonly db: DatabaseService) {}

  private async generateId(): Promise<string> {
    const sql = `SELECT guest_room_id FROM t_guest_room ORDER BY guest_room_id DESC LIMIT 1`;
    const res = await this.db.query(sql);
    if (res.rows.length === 0) return "GR001";
    const last = res.rows[0].guest_room_id.replace("GR", "");
    const next = (parseInt(last, 10) + 1).toString().padStart(3, "0");
    return `GR${next}`;
  }

  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `SELECT * FROM t_guest_room WHERE is_active = $1 ORDER BY action_date DESC, action_time DESC`
      : `SELECT * FROM t_guest_room ORDER BY action_date DESC, action_time DESC`;
    const res = await this.db.query(sql, activeOnly ? [true] : []);
    return res.rows;
  }

  async findOne(id: string) {
    const sql = `SELECT * FROM t_guest_room WHERE guest_room_id = $1`;
    const res = await this.db.query(sql, [id]);
    return res.rows[0];
  }

  async create(dto: CreateGuestRoomDto, user: string, ip: string) {
    const id = await this.generateId();
    const now = new Date().toISOString();

    // Use DB defaults for action_date/action_time when dto.action_date/time are not provided
    const sql = `
      INSERT INTO t_guest_room (
        guest_room_id,
        guest_id,
        room_id,
        check_in_date, check_in_time,
        check_out_date, check_out_time,
        action_type, action_description,
        action_date, action_time,
        remarks,
        is_active,
        inserted_at, inserted_by, inserted_ip
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true,$13,$14,$15
      )
      RETURNING *;
    `;

    const params = [
      id,
      // required guest
      (dto as any).guest_id,
      dto.room_id ?? null,
      dto.check_in_date ?? null,
      dto.check_in_time ?? null,
      dto.check_out_date ?? null,
      dto.check_out_time ?? null,
      dto.action_type,
      dto.action_description ?? null,
      // pass null to use DB defaults for action_date/time if not provided
      dto.action_date ?? null,
      dto.action_time ?? null,
      dto.remarks ?? null,
      now,
      user,
      ip,
    ];

    const res = await this.db.query(sql, params);
    return res.rows[0];
  }

  async update(id: string, dto: UpdateGuestRoomDto, user: string, ip: string) {
    const existing = await this.findOne(id);
    if (!existing) throw new Error(`Guest Room entry '${id}' not found`);

    const now = new Date().toISOString();

    const sql = `
      UPDATE t_guest_room SET
        room_id = $1,
        check_in_date = $2,
        check_in_time = $3,
        check_out_date = $4,
        check_out_time = $5,
        action_type = $6,
        action_description = $7,
        action_date = $8,
        action_time = $9,
        remarks = $10,
        is_active = $11,
        updated_at = $12,
        updated_by = $13,
        updated_ip = $14
      WHERE guest_room_id = $15
      RETURNING *;
    `;

    const params = [
      dto.room_id ?? existing.room_id,
      dto.check_in_date ?? existing.check_in_date,
      dto.check_in_time ?? existing.check_in_time,
      dto.check_out_date ?? existing.check_out_date,
      dto.check_out_time ?? existing.check_out_time,
      dto.action_type ?? existing.action_type,
      dto.action_description ?? existing.action_description,
      dto.action_date ?? existing.action_date,
      dto.action_time ?? existing.action_time,
      dto.remarks ?? existing.remarks,
      dto.is_active ?? existing.is_active,
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
      UPDATE t_guest_room SET
        is_active = false,
        updated_at = $1,
        updated_by = $2,
        updated_ip = $3
      WHERE guest_room_id = $4
      RETURNING *;
    `;
    const res = await this.db.query(sql, [now, user, ip, id]);
    return res.rows[0];
  }
}
