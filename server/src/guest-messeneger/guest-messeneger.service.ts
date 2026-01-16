import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateGuestMessengerDto } from './dto/create-guest-messenger.dto';
import { UpdateGuestMessengerDto } from './dto/update-guest-messenger.dto';
import { GuestMessengerTableQueryDto } from './dto/guest-messenger-table-query.dto';

@Injectable()
export class GuestMessengerService {
  constructor(private readonly db: DatabaseService) {}

  /* ---------- ID GENERATION ---------- */
  private async generateId(): Promise<string> {
    const sql = `
      SELECT guest_messenger_id
      FROM t_guest_messenger
      WHERE guest_messenger_id ~ '^GM[0-9]+$'
      ORDER BY CAST(SUBSTRING(guest_messenger_id, 3) AS INT) DESC
      LIMIT 1;
    `;
    const res = await this.db.query(sql);
    if (res.rows.length === 0) return 'GM001';

    const last = res.rows[0].guest_messenger_id.substring(2);
    const next = parseInt(last, 10) + 1;
    return `GM${next.toString().padStart(3, '0')}`;
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
    const id = await this.generateId();
    const now = new Date().toISOString();

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
        $1,$2,$3,$4,$5,true,$6,$7,$8
      )
      RETURNING *;
    `;

    const res = await this.db.query(sql, [
      id,
      dto.guest_id,
      dto.messenger_id,
      dto.assignment_date,
      dto.remarks ?? null,
      now,
      user,
      ip,
    ]);

    return res.rows[0];
  }

  /* ---------- UPDATE ---------- */
  async update(id: string, dto: UpdateGuestMessengerDto, user: string, ip: string) {
    const existing = await this.findOne(id);
    if (!existing) throw new Error(`Guest Messenger '${id}' not found`);

    const now = new Date().toISOString();

    const sql = `
      UPDATE t_guest_messenger SET
        guest_id = $1,
        messenger_id = $2,
        assignment_date = $3,
        remarks = $4,
        is_active = $5,
        updated_at = $6,
        updated_by = $7,
        updated_ip = $8
      WHERE guest_messenger_id = $9
      RETURNING *;
    `;

    const res = await this.db.query(sql, [
      dto.guest_id,
      dto.messenger_id,
      dto.assignment_date,
      dto.remarks ?? existing.remarks,
      dto.is_active ?? existing.is_active,
      now,
      user,
      ip,
      id,
    ]);

    return res.rows[0];
  }

  /* ---------- SOFT DELETE ---------- */
  async softDelete(id: string, user: string, ip: string) {
    const now = new Date().toISOString();
    const res = await this.db.query(
      `
      UPDATE t_guest_messenger SET
        is_active = false,
        updated_at = $1,
        updated_by = $2,
        updated_ip = $3
      WHERE guest_messenger_id = $4
      RETURNING guest_messenger_id, is_active;
      `,
      [now, user, ip, id],
    );

    return res.rows[0];
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
