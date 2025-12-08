import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly db: DatabaseService) {}

  // generate role_id abbreviation
  private generateRoleId(name: string): string {
    if (!name) return "RL";
    // Split into words, remove empty, keep only letters
    const words = name
      .trim()
      .split(/\s+/)
      .map(w => w.replace(/[^a-zA-Z]/g, ""));
    // CASE 1: Single word → take first 2–3 letters
    if (words.length === 1) {
      const word = words[0].toUpperCase();
      return word.substring(0, Math.min(3, word.length));
    }
    // CASE 2: Two words → take first letters
    if (words.length === 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    // CASE 3: 3 or more words → take first 3 letters (first letters of 3 words)
    return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  }


  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `SELECT * FROM m_roles WHERE is_active = $1 ORDER BY role_id`
      : `SELECT * FROM m_roles ORDER BY role_id`;

    const result = await this.db.query(sql, activeOnly ? [true] : []);
    return result.rows;
  }

  async findOne(id: string) {
    const sql = `SELECT * FROM m_roles WHERE role_id = $1`;
    const result = await this.db.query(sql, [id]);
    return result.rows[0];
  }

  async create(dto: CreateRoleDto, user: string, ip: string) {
    // Convert to IST timestamp but WITHOUT the AM/PM glitch
    const now = new Date().toLocaleString("en-GB", {
      timeZone: "Asia/Kolkata",
      hour12: false,
    }).replace(",", "");

    let role_id = this.generateRoleId(dto.role_name);

    // Ensure uniqueness
    const exists = await this.db.query(
      "SELECT role_id FROM m_roles WHERE role_id = $1",
      [role_id]
    );

    if (exists.rowCount > 0) {
      role_id = role_id + Date.now().toString().slice(-3);
    }

    const sql = `
      INSERT INTO m_roles (
        role_id,
        role_name,
        role_desc,
        is_active,
        inserted_at, inserted_by, inserted_ip,
        updated_at, updated_by, updated_ip
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7, NULL, NULL, NULL)
      RETURNING *;
    `;

    const params = [
      role_id,              // $1
      dto.role_name,        // $2
      dto.role_desc,        // $3
      true,                 // $4 boolean for PostgreSQL
      now,                  // $5
      user,                 // $6
      ip                    // $7
    ];

    const result = await this.db.query(sql, params);
    return result.rows[0];
  }

  // UPDATE role (without touching inserted fields)
  async update(role_id: string, dto: UpdateRoleDto, user: string, ip: string) {
    const now = new Date().toLocaleString("en-GB", {
      timeZone: "Asia/Kolkata",
      hour12: false,
    }).replace(",", "");

    const existing = await this.findOne(role_id);

    if (!existing) {
      throw new Error(`Role with id ${role_id} not found`);
    }

    // 🔥 FIX: convert "1"/"0"/1/0/true/false → boolean
    const activeBool =
      dto.is_active === "1" ||
      dto.is_active === 1 ||
      dto.is_active === true;

    const sql = `
      UPDATE m_roles SET
        role_name = $1,
        role_desc = $2,
        is_active = $3,
        updated_at = $4,
        updated_by = $5,
        updated_ip = $6
      WHERE role_id = $7
      RETURNING *;
    `;

    const params = [
      dto.role_name,
      dto.role_desc ?? existing.role_desc,
      activeBool,        // ← FIXED
      now,
      user,
      ip,
      role_id,
    ];

    const result = await this.db.query(sql, params);
    return result.rows[0];
  }


  // NO DELETE — Soft delete only
  async softDelete(role_id: string, user: string, ip: string) {
    const now = new Date().toISOString();

    const sql = `
      UPDATE m_roles SET
        is_active = $1,
        updated_at = $2,
        updated_by = $3,
        updated_ip = $4
      WHERE role_id = $5
      RETURNING *;
    `;

    const result = await this.db.query(sql, [false, now, user, ip, role_id]);
    return result.rows[0];
  }
}
