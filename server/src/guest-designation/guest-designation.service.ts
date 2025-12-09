import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateGuestDesignationDto } from "./dto/create-guest-designation.dto";
import { UpdateGuestDesignationDto } from "./dto/update-guest-designation.dto";

@Injectable()
export class GuestDesignationService {
  constructor(private readonly db: DatabaseService) {}

  private async generateId(): Promise<string> {
    const sql = `SELECT gd_id FROM t_guest_designation ORDER BY gd_id DESC LIMIT 1`;
    const res = await this.db.query(sql);

    if (res.rows.length === 0) return "GDN001";

    const last = res.rows[0].gd_id.replace("GDN", "");
    const next = (parseInt(last, 10) + 1).toString().padStart(3, "0");

    return `GDN${next}`;
  }

  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `SELECT * FROM t_guest_designation WHERE is_active = true ORDER BY inserted_at DESC`
      : `SELECT * FROM t_guest_designation ORDER BY inserted_at DESC`;

    return (await this.db.query(sql)).rows;
  }

  async create(dto: CreateGuestDesignationDto, user: string, ip: string) {
    const id = await this.generateId();
    const now = new Date().toISOString();

    const sql = `
      INSERT INTO t_guest_designation (
        gd_id, guest_id, designation_id,
        department, organization, office_location,
        is_current, is_active,
        inserted_at, inserted_by, inserted_ip
      ) VALUES (
        $1,$2,$3,$4,$5,$6,true,true,$7,$8,$9
      ) RETURNING *;
    `;

    const params = [
      id,
      dto.guest_id,
      dto.designation_id,
      dto.department ?? null,
      dto.organization ?? null,
      dto.office_location ?? null,
      now,
      user,
      ip,
    ];

    return (await this.db.query(sql, params)).rows[0];
  }

  async update(id: string, dto: UpdateGuestDesignationDto, user: string, ip: string) {
    const existing = (
      await this.db.query(`SELECT * FROM t_guest_designation WHERE gd_id=$1`, [id])
    ).rows[0];

    if (!existing) throw new Error(`Designation '${id}' not found`);

    const now = new Date().toISOString();

    const sql = `
      UPDATE t_guest_designation SET
        designation_id = $1,
        department = $2,
        organization = $3,
        office_location = $4,
        is_current = $5,
        is_active = $6,
        updated_at = $7,
        updated_by = $8,
        updated_ip = $9
      WHERE gd_id = $10
      RETURNING *;
    `;

    const params = [
      dto.designation_id ?? existing.designation_id,
      dto.department ?? existing.department,
      dto.organization ?? existing.organization,
      dto.office_location ?? existing.office_location,
      dto.is_current ?? existing.is_current,
      dto.is_active ?? existing.is_active,
      now,
      user,
      ip,
      id,
    ];

    return (await this.db.query(sql, params)).rows[0];
  }
}
