import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateMessengerDto } from './dto/create-messenger.dto';
import { UpdateMessengerDto } from './dto/update-messenger.dto';
import { MessengerTableQueryDto } from './dto/messenger-table-query.dto';
import { transliterateToDevanagari } from '../../common/utlis/transliteration.util';

@Injectable()
export class MessengerService {
  constructor(private readonly db: DatabaseService) { }

  /* ---------- ID GENERATION ---------- */
  private async generateMessengerId(client: any): Promise<string> {
    const res = await client.query(`
    SELECT 'M' || LPAD(nextval('messenger_seq')::text, 3, '0') AS id
  `);
    return res.rows[0].id;
  }

  // private async generateMessengerId(): Promise<string> {
  //   const sql = `
  //     SELECT messenger_id
  //     FROM m_messenger
  //     WHERE messenger_id ~ '^M[0-9]+$'
  //     ORDER BY CAST(SUBSTRING(messenger_id, 2) AS INT) DESC
  //     LIMIT 1;
  //   `;

  //   const res = await this.db.query(sql);
  //   if (res.rows.length === 0) return 'M001';

  //   const lastId = res.rows[0].messenger_id;
  //   const next = parseInt(lastId.substring(1), 10) + 1;
  //   return `M${next.toString().padStart(3, '0')}`;
  // }

  /* ---------- FIND BY ID ---------- */
  async findOneById(id: string) {
    const res = await this.db.query(
      `SELECT * FROM m_messenger WHERE messenger_id = $1`,
      [id],
    );
    return res.rows[0];
  }

  /* ---------- CREATE ---------- */
  async create(dto: CreateMessengerDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {

      const id = await this.generateMessengerId(client);
      const now = new Date().toISOString();
      const messenger_name_local_language = transliterateToDevanagari(dto.messenger_name);

      const sql = `
        INSERT INTO m_messenger (
          messenger_id,
          messenger_name,
          messenger_name_local_language,
          primary_mobile,
          secondary_mobile,
          email,
          designation,
          remarks,
          is_active,
          inserted_at, inserted_by, inserted_ip
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,
          true, NOW(),
          $9,$10
        )
        RETURNING *
      `;

      const params = [
        id,
        dto.messenger_name,
        messenger_name_local_language,
        dto.primary_mobile,
        dto.secondary_mobile ?? null,
        dto.email ?? null,
        dto.designation ?? null,
        dto.remarks ?? null,
        user,
        ip,
      ];

      const res = await client.query(sql, params);
      return res.rows[0];
    });
  }

  /* ---------- UPDATE ---------- */
  async update(id: string, dto: UpdateMessengerDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {

      const existingRes = await client.query(
        `SELECT * FROM m_messenger WHERE messenger_id = $1 FOR UPDATE`,
        [id],
      );

      if (!existingRes.rowCount) {
        throw new NotFoundException(`Messenger '${id}' not found`);
      }

      const existing = existingRes.rows[0];

      const messenger_name_local_language =
        transliterateToDevanagari(dto.messenger_name ?? existing.messenger_name);

      // const now = new Date().toISOString();

      const sql = `
        UPDATE m_messenger SET
          messenger_name = $1,
          messenger_name_local_language = $2,
          primary_mobile = $3,
          secondary_mobile = $4,
          email = $5,
          designation = $6,
          remarks = $7,
          is_active = $8,
          updated_at = NOW(),
          updated_by = $9,
          updated_ip = $10
        WHERE messenger_id = $11
        RETURNING *
      `;

      const params = [
        dto.messenger_name ?? existing.messenger_name,
        messenger_name_local_language,
        dto.primary_mobile ?? existing.primary_mobile,
        dto.secondary_mobile ?? existing.secondary_mobile,
        dto.email ?? existing.email,
        dto.designation ?? existing.designation,
        dto.remarks ?? existing.remarks,
        dto.is_active ?? existing.is_active,
        user,
        ip,
        id,
      ];

      const res = await client.query(sql, params);
      return res.rows[0];
    });
  }

  /* ---------- SOFT DELETE ---------- */
  async softDelete(id: string, user: string, ip: string) {
    return this.db.transaction(async (client) => {

      const existingRes = await client.query(
        `SELECT * FROM m_messenger WHERE messenger_id = $1 FOR UPDATE`,
        [id],
      );

      if (!existingRes.rowCount) {
        throw new NotFoundException(`Messenger '${id}' not found`);
      }

      const existing = existingRes.rows[0];

      // 🔴 BLOCK DELETE IF ASSIGNED TO ANY GUEST
      const assigned = await client.query(
        `
        SELECT 1
        FROM t_guest_messenger
        WHERE messenger_id = $1
          AND is_active = TRUE
        LIMIT 1
        `,
        [id]
      );

      if (assigned.rowCount > 0) {
        throw new BadRequestException(
          `Cannot delete messenger '${existing.messenger_name}' because it is currently assigned to a guest`
        );
      }

      const res = await client.query(
        `
        UPDATE m_messenger SET
          is_active = FALSE,
          updated_at = NOW(),
          updated_by = $1,
          updated_ip = $2
        WHERE messenger_id = $3
        RETURNING messenger_id, is_active;
        `,
        [user, ip, id]
      );

      return res.rows[0];
    });
  }

  /* ---------- DATA TABLE ---------- */
  async getMessengerTable(query: MessengerTableQueryDto) {
    const page = query.page;
    const limit = query.limit;
    const offset = (page - 1) * limit;

    /* ---------- SORT WHITELIST ---------- */
    const SORT_MAP: Record<string, string> = {
      messenger_name: 'messenger_name',
      primary_mobile: 'primary_mobile',
      designation: 'designation',
      inserted_at: 'inserted_at',
    };

    const sortColumn =
      SORT_MAP[query.sortBy ?? 'messenger_name'] ?? 'messenger_name';

    const sortOrder = query.sortOrder === 'desc' ? 'DESC' : 'ASC';

    /* ---------- FILTERS ---------- */
    const where: string[] = [];
    const params: any[] = [];

    // status filters
    if (query.status === 'active') {
      where.push('m.is_active = true');
    }

    if (query.status === 'inactive') {
      where.push('m.is_active = false');
    }

    if (query.status === 'assigned') {
      where.push(`
        m.is_active = true
        AND EXISTS (
          SELECT 1
          FROM t_guest_messenger tgm
          WHERE tgm.messenger_id = m.messenger_id
            AND tgm.is_active = true
        )
      `);
    }

if (query.status === 'unassigned') {
  where.push(`
    m.is_active = true
    AND NOT EXISTS (
      SELECT 1
      FROM t_guest_messenger tgm
      WHERE tgm.messenger_id = m.messenger_id
        AND tgm.is_active = true
    )
  `);
}

    // search (name, mobile, email)
    if (query.search) {
      params.push(`%${query.search}%`);
      where.push(`
        (
            messenger_name ILIKE $${params.length}
            OR primary_mobile ILIKE $${params.length}
            OR email ILIKE $${params.length}
        )
        `);
    }

    const whereClause =
      where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    /* ---------- DATA QUERY ---------- */
    const dataSql = `
        SELECT
        messenger_id,
        messenger_name,
        messenger_name_local_language,
        primary_mobile,
        secondary_mobile,
        email,
        designation,
        remarks,
        is_active,
        FROM m_messenger m
        ${whereClause}
        ORDER BY ${sortColumn} ${sortOrder}
        LIMIT $${params.length + 1}
        OFFSET $${params.length + 2};
    `;

    const countSql = `
        SELECT COUNT(*)::int AS count
        FROM m_messenger m
        ${whereClause};
    `;
    const statsSql = `
      SELECT
        COUNT(*) FILTER (WHERE is_active = true) AS active,
        COUNT(*) FILTER (WHERE is_active = false) AS inactive,
        COUNT(*) FILTER (
          WHERE is_active = true
            AND EXISTS (
              SELECT 1 FROM t_guest_messenger tgm
              WHERE tgm.messenger_id = m.messenger_id
                AND tgm.is_active = true
            )
        ) AS assigned,
        COUNT(*) FILTER (
          WHERE is_active = true
            AND NOT EXISTS (
              SELECT 1 FROM t_guest_messenger tgm
              WHERE tgm.messenger_id = m.messenger_id
                AND tgm.is_active = true
            )
        ) AS unassigned
      FROM m_messenger m;
    `;

    const dataRes = await this.db.query(dataSql, [...params, limit, offset]);
    const countRes = await this.db.query(countSql, params);
    const statsRes = await this.db.query(statsSql);

    return {
      data: dataRes.rows,
      totalCount: countRes.rows[0].count,
      stats: statsRes.rows[0],
    };
  }
}