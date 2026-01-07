import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateGuestHousekeepingDto } from "./dto/create-guest-housekeeping.dto";
import { UpdateGuestHousekeepingDto } from "./dto/update-guest-housekeeping.dto";

@Injectable()
export class GuestHousekeepingService {
  constructor(private readonly db: DatabaseService) {}

  private async generateId(): Promise<string> {
    const sql = `SELECT guest_hk_id FROM t_room_housekeeping ORDER BY guest_hk_id DESC LIMIT 1`;
    const res = await this.db.query(sql);

    if (res.rows.length === 0) return "RHK001";

    const last = res.rows[0].guest_hk_id.replace("RHK", "");
    const next = (parseInt(last, 10) + 1).toString().padStart(3, "0");

    return `RHK${next}`;
  }

  async findAll(activeOnly = true) {
  const sql = activeOnly
    ? `SELECT * FROM t_room_housekeeping WHERE status != 'Cancelled' ORDER BY task_date DESC`
    : `SELECT * FROM t_room_housekeeping ORDER BY task_date DESC`;

  const res = await this.db.query(sql);
  return res.rows;
  }

  async findOne(id: string) {
    const sql = `SELECT * FROM t_room_housekeeping WHERE guest_hk_id = $1`;
    const res = await this.db.query(sql, [id]);
    return res.rows[0];
  }

  async create(dto: CreateGuestHousekeepingDto, user: string, ip: string) {
    // 1️⃣ Find active guest for this room
    const guestRes = await this.db.query(
      `
      SELECT guest_id
      FROM t_guest_room
      WHERE room_id = $1
        AND is_active = TRUE
      `,
      [dto.room_id]
    );
    const guestId = guestRes.rows[0]?.guest_id ?? null;
    const id = await this.generateId();
    const now = new Date().toISOString();
    const sql = `
      INSERT INTO t_room_housekeeping (
        guest_hk_id,
        hk_id,
        room_id,
        guest_id,           -- ✅ ADD THIS
        task_date,
        task_shift,
        service_type,
        admin_instructions,
        status,
        assigned_by,
        assigned_at,
        is_active            -- ✅ ADD THIS
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,'Scheduled',$9,$10,True
      )
      RETURNING *;
    `;
    const params = [
      id,
      dto.hk_id,
      dto.room_id,
      guestId,                 // ✅ ADD
      dto.task_date,
      dto.task_shift,
      dto.service_type,
      dto.admin_instructions ?? null,
      user,
      now,
    ];
    const res = await this.db.query(sql, params);
    return res.rows[0];
  }

  async update(id: string, dto: UpdateGuestHousekeepingDto, user: string, ip: string) {
    const existing = await this.findOne(id);
    if (!existing) throw new Error(`Housekeeping task '${id}' not found`);

    const now = new Date().toISOString();

    const sql = `
      UPDATE t_room_housekeeping SET
        hk_id = $1,
        room_id = $2,
        task_date = $3,
        task_shift = $4,
        service_type = $5,
        admin_instructions = $6,
        status = $7,
        completed_at = $8
      WHERE guest_hk_id = $9
      RETURNING *;
    `;

    const params = [
      dto.hk_id ?? existing.hk_id,
      dto.room_id ?? existing.room_id,
      dto.task_date ?? existing.task_date,
      dto.task_shift ?? existing.task_shift,
      dto.service_type ?? existing.service_type,
      dto.admin_instructions ?? existing.admin_instructions,
      dto.status ?? existing.status,
      dto.completed_at ?? existing.completed_at,
      id,
    ];

    const res = await this.db.query(sql, params);
    return res.rows[0];
  }

  async cancel(id: string) {
    const sql = `
      UPDATE t_room_housekeeping
      SET
        status = 'Cancelled',
        is_active = FALSE,
        completed_at = NOW()
      WHERE guest_hk_id = $1
      RETURNING *;
    `;
    const res = await this.db.query(sql, [id]);
    return res.rows[0];
  }
}
