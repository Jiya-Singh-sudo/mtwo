import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateButlerDto } from './dto/create-butler.dto';
import { UpdateButlerDto } from './dto/update-butler.dto';
import { transliterateToDevanagari } from '../../common/utlis/transliteration.util';
@Injectable()
export class ButlersService {
  constructor(private readonly db: DatabaseService) {}
  private async generateButlerId(client: any): Promise<string> {
    const sql = `SELECT 'B' || LPAD(nextval('butler_id_seq')::text, 3, '0') AS butler_id`;

    const result = await client.query(sql);
    return result.rows[0].butler_id;
  }

  async getTable(query: any) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "butler_name",
      sortOrder = "asc",
      status,
    } = query;

    const offset = (page - 1) * limit;

    const SORT_MAP: Record<string, string> = {
      butler_id: "b.butler_id",
      butler_name: "b.butler_name",
      shift: "b.shift",
      is_active: "b.is_active",
      inserted_at: "b.inserted_at",
    };

    const orderColumn = SORT_MAP[sortBy] ?? SORT_MAP.butler_name;
    const orderDir = sortOrder === "desc" ? "DESC" : "ASC";

    const where: string[] = [];
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      where.push(
        `(b.butler_name ILIKE $${params.length} OR b.butler_id ILIKE $${params.length})`
      );
    }

    if (status === "Active") {
      params.push(true);
      where.push(`b.is_active = $${params.length}`);
    }

    if (status === "Inactive") {
      params.push(false);
      where.push(`b.is_active = $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // ---------- DATA ----------
    const dataSql = `
      SELECT
        b.butler_id,
        b.butler_name,
        b.butler_name_local_language,
        b.shift,
        b.is_active,
        b.butler_mobile,
        b.butler_alternate_mobile,
        b.address,
        b.remarks,
        b.shift,
        b.inserted_at,
        b.inserted_by,
        b.inserted_ip,
        b.updated_at,
        b.updated_by,
        b.updated_ip
      FROM m_butler b
      ${whereSql}
      ORDER BY ${orderColumn} ${orderDir}
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2};
    `;

    const data = await this.db.query(dataSql, [
      ...params,
      limit,
      offset,
    ]);

    // ---------- COUNT ----------
    const countSql = `
      SELECT COUNT(*) AS count
      FROM m_butler b
      ${whereSql};
    `;

    const count = await this.db.query(countSql, params);

    return {
      data: data.rows,
      totalCount: Number(count.rows[0].count),
    };
  }

  async findAll(activeOnly = true) {
    return this.db.transaction(async (client) => {
      const sql = activeOnly
        ? `SELECT * FROM m_butler WHERE is_active = $1 ORDER BY butler_name`
        : `SELECT * FROM m_butler ORDER BY butler_name`;

      const result = await client.query(sql, activeOnly ? [true] : []);
      return result.rows;
    });
  }

  async findOneById(id: string) {
    return this.db.transaction(async (client) => {
      const sql = `SELECT * FROM m_butler WHERE butler_id = $1`;
      const result = await client.query(sql, [id]);
      return result.rows[0];
    });
  }

  async create(dto: CreateButlerDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      const butlerId = await this.generateButlerId(client);
      const now = new Date()
        .toLocaleString('en-GB', { hour12: false, timeZone: 'Asia/Kolkata' })
        .replace(',', '');
      const butler_name_local_language = transliterateToDevanagari(dto.butler_name);

      const sql = `
        INSERT INTO m_butler (
          butler_id,
          butler_name,
          butler_name_local_language,
          butler_mobile,
          butler_alternate_mobile,
          address,
          remarks,
          shift,
          is_active,
          inserted_at,
          inserted_by,
          inserted_ip,
          updated_at,
          updated_by,
          updated_ip
        )
        VALUES (
          $1,  -- butler_id
          $2,  -- butler_name
          $3,  -- butler_name_local_language
          $4,  -- butler_mobile
          $5,  -- butler_alternate_mobile
          $6,  -- address
          $7,  -- remarks
          $8,  -- shift
          true,
          NOW(),  -- inserted_at
          $9, -- inserted_by
          $10, -- inserted_ip
          NULL,
          NULL,
          NULL
        )
        RETURNING *`;

    const params = [
      butlerId,                        // $1
      dto.butler_name,                // $2
      butler_name_local_language, // $3
      dto.butler_mobile,              // $4
      dto.butler_alternate_mobile ?? null, // $5
      dto.address ?? null,            // $6
      dto.remarks ?? null,            // $7
      dto.shift,                      // $8  ← THIS was missing
      user,                           // $9
      ip                              // $10
    ];

      const res = await client.query(sql, params);
      return res.rows[0];
    });
  }

  async update(id: string, dto: UpdateButlerDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      const existingResult = await client.query(
        `SELECT * FROM m_butler WHERE butler_id = $1 FOR UPDATE`,
        [id]
      );

      const existing = existingResult.rows[0];
      if (!existing) throw new NotFoundException(`Butler '${id}' not found`);

      const now = new Date()
        .toLocaleString('en-GB', { hour12: false, timeZone: 'Asia/Kolkata' })
        .replace(',', '');
      
      const butler_name_local_language = transliterateToDevanagari(dto.butler_name);

      const sql = `
        UPDATE m_butler SET
          butler_name = $1,
          butler_name_local_language = $2,
          butler_mobile = $3,
          butler_alternate_mobile = $4,
          address = $5,
          remarks = $6,
          shift = $7,
          is_active = $8,
          updated_at = NOW(),
          updated_by = $9,
          updated_ip = $10
        WHERE butler_id = $11
        RETURNING *;
      `;

      const params = [
        dto.butler_name ?? existing.butler_name,
        butler_name_local_language,
        dto.butler_mobile ?? existing.butler_mobile,
        dto.butler_alternate_mobile ?? existing.butler_alternate_mobile,
        dto.address ?? existing.address,
        dto.remarks ?? existing.remarks,
        dto.shift ?? existing.shift,
        dto.is_active ?? existing.is_active,
        user,
        ip,
        existing.butler_id,
      ];

      const res = await client.query(sql, params);
      return res.rows[0];
    });
  }

  async softDelete(id: string, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      const existingResult = await client.query(
        `SELECT * FROM m_butler WHERE butler_id = $1 FOR UPDATE`,
        [id]
      );

      const existing = existingResult.rows[0];
      if (!existing) throw new NotFoundException(`Butler '${id}' not found`);

      const now = new Date().toISOString();

      const sql = `
        UPDATE m_butler SET
          is_active = false,
          updated_at = NOW(),
          updated_by = $1,
          updated_ip = $2
        WHERE butler_id = $3
        RETURNING *;
      `;

      const params = [user, ip, existing.butler_id];
      const res = await client.query(sql, params);
      return res.rows[0];
    });
  }
}

