import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateGuestNetworkDto } from "./dto/create-guest-network.dto";
import { UpdateGuestNetworkDto } from "./dto/update-guest-network.dto";

@Injectable()
export class GuestNetworkService {
  constructor(private readonly db: DatabaseService) {}

  private async generateId(): Promise<string> {
    const sql = `SELECT guest_network_id FROM t_guest_network ORDER BY guest_network_id DESC LIMIT 1`;
    const res = await this.db.query(sql);
    if (res.rows.length === 0) return "GN001";
    const last = res.rows[0].guest_network_id.replace("GN", "");
    const next = (parseInt(last, 10) + 1).toString().padStart(3, "0");
    return `GN${next}`;
  }

  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `SELECT * FROM t_guest_network WHERE is_active = $1 ORDER BY start_date DESC, start_time DESC`
      : `SELECT * FROM t_guest_network ORDER BY start_date DESC, start_time DESC`;
    const res = await this.db.query(sql, activeOnly ? [true] : []);
    return res.rows;
  }

  async findOne(id: string) {
    const sql = `SELECT * FROM t_guest_network WHERE guest_network_id = $1`;
    const res = await this.db.query(sql, [id]);
    return res.rows[0];
  }

  async create(dto: CreateGuestNetworkDto, user: string, ip: string) {
    const id = await this.generateId();
    const now = new Date().toISOString();

    const sql = `
      INSERT INTO t_guest_network (
        guest_network_id, guest_id, provider_id, room_id,
        network_zone_from, network_zone_to,
        start_date, start_time, end_date, end_time,
        start_status, end_status, network_status,
        description, remarks,
        is_active,
        inserted_at, inserted_by, inserted_ip
      ) VALUES (
        $1,$2,$3,$4,
        $5,$6,
        $7,$8,$9,$10,
        $11,$12,$13,
        $14,$15,
        true,
        $16,$17,$18
      ) RETURNING *;
    `;

    const params = [
      id,
      dto.guest_id,
      dto.provider_id,
      dto.room_id ?? null,
      dto.network_zone_from ?? null,
      dto.network_zone_to ?? null,
      dto.start_date,
      dto.start_time,
      dto.end_date ?? null,
      dto.end_time ?? null,
      dto.start_status ?? "Waiting",
      dto.end_status ?? "Waiting",
      dto.network_status ?? "Requested",
      dto.description ?? null,
      dto.remarks ?? null,
      now,
      user,
      ip,
    ];

    const res = await this.db.query(sql, params);
    return res.rows[0];
  }

  async update(id: string, dto: UpdateGuestNetworkDto, user: string, ip: string) {
    const existing = await this.findOne(id);
    if (!existing) throw new Error(`Guest Network entry '${id}' not found`);

    const now = new Date().toISOString();

    const sql = `
      UPDATE t_guest_network SET
        provider_id = $1,
        room_id = $2,
        network_zone_from = $3,
        network_zone_to = $4,
        start_date = $5,
        start_time = $6,
        end_date = $7,
        end_time = $8,
        start_status = $9,
        end_status = $10,
        network_status = $11,
        description = $12,
        remarks = $13,
        is_active = $14,
        updated_at = $15,
        updated_by = $16,
        updated_ip = $17
      WHERE guest_network_id = $18
      RETURNING *;
    `;

    const params = [
      dto.provider_id ?? existing.provider_id,
      dto.room_id ?? existing.room_id,
      dto.network_zone_from ?? existing.network_zone_from,
      dto.network_zone_to ?? existing.network_zone_to,
      dto.start_date ?? existing.start_date,
      dto.start_time ?? existing.start_time,
      dto.end_date ?? existing.end_date,
      dto.end_time ?? existing.end_time,
      dto.start_status ?? existing.start_status,
      dto.end_status ?? existing.end_status,
      dto.network_status ?? existing.network_status,
      dto.description ?? existing.description,
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
      UPDATE t_guest_network SET
        is_active = false,
        updated_at = $1,
        updated_by = $2,
        updated_ip = $3
      WHERE guest_network_id = $4
      RETURNING *;
    `;
    const res = await this.db.query(sql, [now, user, ip, id]);
    return res.rows[0];
  }
}
