import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateGuestMessengerDto } from './dto/create-guest-messenger.dto';
import { UnassignGuestMessengerDto } from './dto/unassign-guest-messenger.dto';
import { GuestMessengerTableQueryDto } from './dto/guest-messenger-table-query.dto';
import { GuestNetworkTableQueryDto } from './dto/guest-network-table.dto';

@Injectable()
export class GuestMessengerService {
  constructor(private readonly db: DatabaseService) {}

  /* ---------- ID GENERATION ---------- */
  // private async generateId(): Promise<string> {
  //   const sql = `
  //     SELECT guest_messenger_id
  //     FROM t_guest_messenger
  //     WHERE guest_messenger_id ~ '^GM[0-9]+$'
  //     ORDER BY CAST(SUBSTRING(guest_messenger_id, 3) AS INT) DESC
  //     LIMIT 1;
  //   `;
  //   const res = await this.db.query(sql);
  //   if (res.rows.length === 0) return 'GM001';

  //   const last = res.rows[0].guest_messenger_id.substring(2);
  //   const next = parseInt(last, 10) + 1;
  //   return `GM${next.toString().padStart(3, '0')}`;
  // }
  private async generateId(client: any): Promise<string> {
    const res = await client.query(`
      SELECT 'GM' || LPAD(nextval('guest_messenger_seq')::text, 3, '0') AS id
    `);
    return res.rows[0].id;
  }

  async getGuestNetworkTable(params: GuestNetworkTableQueryDto) {
    const { page, limit, search, sortBy, sortOrder } = params;

    const offset = (page - 1) * limit;

    /* ---------------- SORT MAP ---------------- */
    const SORT_MAP: Record<string, string> = {
      guest_name: 'g.guest_name',
      network_status: 'gn.status',
      messenger_status: 'gm.status',
      requested_at: 'COALESCE(gn.requested_at, gm.requested_at)',
    };

    const sortColumn =
      SORT_MAP[sortBy ?? 'requested_at'] ??
      SORT_MAP.requested_at;

    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

    /* ---------------- WHERE ---------------- */
    const where: string[] = [
      'g.is_active = TRUE',
      '(gn.guest_network_id IS NOT NULL OR gm.guest_messenger_id IS NOT NULL)',
    ];

    const sqlParams: any[] = [];
    let idx = 1;

    /* ---------------- SEARCH ---------------- */
    if (search) {
      where.push(`
        (
          g.guest_name ILIKE $${idx}
          OR n.network_name ILIKE $${idx}
          OR m.messenger_name ILIKE $${idx}
        )
      `);
      sqlParams.push(`%${search}%`);
      idx++;
    }

    const whereSql = `WHERE ${where.join(' AND ')}`;

    /* ---------------- COUNT ---------------- */
    const countSql = `
      SELECT COUNT(DISTINCT g.guest_id)::int AS total
      FROM m_guest g

      LEFT JOIN t_guest_network gn
        ON gn.guest_id = g.guest_id
       AND gn.is_active = TRUE

      LEFT JOIN t_guest_messenger gm
        ON gm.guest_id = g.guest_id
       AND gm.is_active = TRUE

      LEFT JOIN m_network n
        ON n.network_id = gn.network_id

      LEFT JOIN m_messenger m
        ON m.messenger_id = gm.messenger_id

      ${whereSql};
    `;

    /* ---------------- DATA ---------------- */
    const dataSql = `
      SELECT DISTINCT
        g.guest_id,
        g.guest_name,

        io.room_id,

        -- Network
        gn.guest_network_id,
        gn.status AS network_status,
        n.network_id,
        n.network_name,

        -- Messenger
        gm.guest_messenger_id,
        gm.status AS messenger_status,
        m.messenger_id,
        m.messenger_name,

        COALESCE(gn.requested_at, gm.requested_at) AS requested_at

      FROM m_guest g

      LEFT JOIN t_guest_inout io
        ON io.guest_id = g.guest_id
       AND io.is_active = TRUE

      LEFT JOIN t_guest_network gn
        ON gn.guest_id = g.guest_id
       AND gn.is_active = TRUE

      LEFT JOIN m_network n
        ON n.network_id = gn.network_id

      LEFT JOIN t_guest_messenger gm
        ON gm.guest_id = g.guest_id
       AND gm.is_active = TRUE

      LEFT JOIN m_messenger m
        ON m.messenger_id = gm.messenger_id

      ${whereSql}
      ORDER BY ${sortColumn} ${order}
      LIMIT $${idx} OFFSET $${idx + 1};
    `;

    const countRes = await this.db.query(countSql, sqlParams);

    sqlParams.push(limit, offset);
    const dataRes = await this.db.query(dataSql, sqlParams);

    return {
      data: dataRes.rows,
      totalCount: countRes.rows[0]?.total ?? 0,
    };
  }

  async findOne(id: string) {
    const res = await this.db.query(
      `SELECT * FROM t_guest_messenger WHERE guest_messenger_id = $1`,
      [id],
    );
    return res.rows[0];
  }

  /* ---------- CREATE ---------- */
  async create(dto: CreateGuestMessengerDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {

      // 🔒 Validate guest
      const guest = await client.query(
        `SELECT 1 FROM m_guest WHERE guest_id = $1 AND is_active = TRUE FOR UPDATE`,
        [dto.guest_id]
      );

      if (!guest.rowCount) {
        throw new NotFoundException('Guest not found');
      }

      // 🔒 Validate messenger
      const messenger = await client.query(
        `SELECT 1 FROM m_messenger WHERE messenger_id = $1 AND is_active = TRUE FOR UPDATE`,
        [dto.messenger_id]
      );

      if (!messenger.rowCount) {
        throw new NotFoundException('Messenger not found');
      }

      // 🔒 Prevent duplicate active assignment
      const duplicate = await client.query(
        `
        SELECT 1 FROM t_guest_messenger
        WHERE guest_id = $1
          AND messenger_id = $2
          AND is_active = TRUE
        FOR UPDATE
        `,
        [dto.guest_id, dto.messenger_id]
      );

      if (duplicate.rowCount > 0) {
        throw new ConflictException('Messenger already assigned to guest');
      }
      const id = await this.generateId(client);
      // const now = new Date().toISOString();

      const sql = `
        INSERT INTO t_guest_messenger (
          guest_messenger_id,
          guest_id,
          messenger_id,
          assignment_date,
          remarks,
          is_active,
          inserted_at,
          inserted_by,
          inserted_ip
        ) VALUES (
          $1,$2,$3,$4,$5,true,NOW(),$6,$7
        )
        RETURNING *;
      `;

      const res = await client.query(sql, [
        id,
        dto.guest_id,
        dto.messenger_id,
        dto.assignment_date,
        dto.remarks ?? null,
        user,
        ip,
      ]);

      return res.rows[0];
    });
  }

  /* ---------- UPDATE ---------- */
  // async update(id: string, dto: UpdateGuestMessengerDto, user: string, ip: string) {
  //   const existing = await this.findOne(id);
  //   if (!existing) throw new Error(`Guest Messenger '${id}' not found`);

  //   const now = new Date().toISOString();

  //   const sql = `
  //     UPDATE t_guest_messenger SET
  //       guest_id = $1,
  //       messenger_id = $2,
  //       assignment_date = $3,
  //       remarks = $4,
  //       is_active = $5,
  //       updated_at = $6,
  //       updated_by = $7,
  //       updated_ip = $8
  //     WHERE guest_messenger_id = $9
  //     RETURNING *;
  //   `;

  //   const res = await this.db.query(sql, [
  //     dto.guest_id,
  //     dto.messenger_id,
  //     dto.assignment_date,
  //     dto.remarks ?? existing.remarks,
  //     dto.is_active ?? existing.is_active,
  //     now,
  //     user,
  //     ip,
  //     id,
  //   ]);

  //   return res.rows[0];
  // }

  async unassign(
    id: string,
    user: string,
    ip: string,
    remarks?: string
  ) {
    return this.db.transaction(async (client) => {
      const existing = await client.query(
        `SELECT 1 FROM t_guest_messenger 
        WHERE guest_messenger_id = $1 
        FOR UPDATE`,
        [id]
      );

      if (!existing.rowCount) {
        throw new NotFoundException('Assignment not found');
      }
      const res = await client.query(
        `
        UPDATE t_guest_messenger SET
          is_active = false,
          remarks = COALESCE($1, remarks),
          updated_at = NOW(),
          updated_by = $2,
          updated_ip = $3
        WHERE guest_messenger_id = $4
        RETURNING *;
        `,
        [remarks ?? null, user, ip, id]
      );

      return res.rows[0];
    });
  }

  /* ---------- SOFT DELETE ---------- */
  async softDelete(id: string, user: string, ip: string) {
    return this.db.transaction(async (client) => {

      const existing = await client.query(
        `SELECT 1 FROM t_guest_messenger 
        WHERE guest_messenger_id = $1 
        FOR UPDATE`,
        [id]
      );

      if (!existing.rowCount) {
        throw new NotFoundException('Assignment not found');
      }
      const res = await client.query(
        `
        UPDATE t_guest_messenger SET
          is_active = false,
          updated_at = NOW(),
          updated_by = $1,
          updated_ip = $2
        WHERE guest_messenger_id = $3
        RETURNING guest_messenger_id, is_active;
        `,
        [user, ip, id],
      );

      return res.rows[0];
    });
  }

  /* ---------- DATA TABLE ---------- */
  async getGuestMessengerTable(query: GuestMessengerTableQueryDto) {
    const offset = (query.page - 1) * query.limit;

    const SORT_MAP: Record<string, string> = {
      assignment_date: 'gm.assignment_date',
      guest_name: 'g.guest_name',
      messenger_name: 'm.messenger_name',
    };

    const sortColumn =
      SORT_MAP[query.sortBy ?? 'assignment_date'] ?? 'gm.assignment_date';
    const sortOrder = query.sortOrder === 'asc' ? 'ASC' : 'DESC';

    const where: string[] = [];
    const params: any[] = [];

    if (query.status === 'active') where.push('gm.is_active = true');
    if (query.status === 'inactive') where.push('gm.is_active = false');

    if (query.search) {
      params.push(`%${query.search}%`);
      where.push(`
        (
          g.guest_name ILIKE $${params.length}
          OR m.messenger_name ILIKE $${params.length}
        )
      `);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const dataSql = `
      SELECT
        gm.guest_messenger_id,
        g.guest_id,
        g.guest_name,
        m.messenger_name,
        gm.assignment_date,
        gm.remarks,
        gm.is_active
      FROM t_guest_messenger gm
      JOIN m_guest g ON g.guest_id = gm.guest_id
      JOIN m_messenger m ON m.messenger_id = gm.messenger_id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2};
    `;

    const countSql = `
      SELECT COUNT(*)::int AS count
      FROM t_guest_messenger gm
      JOIN m_guest g ON g.guest_id = gm.guest_id
      JOIN m_messenger m ON m.messenger_id = gm.messenger_id
      ${whereClause};
    `;

    const data = await this.db.query(dataSql, [...params, query.limit, offset]);
    const count = await this.db.query(countSql, params);

    return {
      data: data.rows,
      totalCount: count.rows[0].count,
    };
  }
}
