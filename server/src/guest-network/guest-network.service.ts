import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateGuestNetworkDto } from "./dto/create-guest-network.dto";
import { GuestNetworkTableQueryDto } from "./dto/guest-network-table-query.dto";
import { CloseGuestNetworkDto } from "./dto/close-guest-network.dto";
import { UpdateGuestNetworkDto } from "./dto/update-guest-network.dto";
import { ChangeGuestNetworkStatusDto } from "./dto/changes-guest-network-status.dto";

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
async getGuestNetworkTable(query: GuestNetworkTableQueryDto) {
  const page = query.page;
  const limit = query.limit;
  const offset = (page - 1) * limit;

  /* ---------- SORT WHITELIST ---------- */
  const SORT_MAP: Record<string, string> = {
    entry_date: 'io.entry_date',
    guest_name: 'g.guest_name',
    network_status: "COALESCE(gn.network_status, '')",
  };

  const sortColumn =
    SORT_MAP[query.sortBy ?? 'entry_date'] ?? 'io.entry_date';

  const sortOrder = query.sortOrder === 'asc' ? 'ASC' : 'DESC';

  const where: string[] = [
    'io.is_active = TRUE',
    'g.is_active = TRUE',
    `
    (
      /* Scheduled */
      (io.status = 'Scheduled' AND io.entry_date >= CURRENT_DATE)

      /* Entered / Inside */
      OR io.status IN ('Entered', 'Inside')

      /* Exited within 24 hours */
      OR (
        io.status = 'Exited'
        AND NOW() <= (
          io.exit_date + COALESCE(io.exit_time, TIME '00:00')
        ) + INTERVAL '24 hours'
      )
    )
    `,
  ];

  const params: any[] = [];
  let idx = 1;

  /* ---------- SEARCH ---------- */
  if (query.search) {
    where.push(`
      (
        g.guest_name ILIKE $${idx}
        OR wp.provider_name ILIKE $${idx}
      )
    `);
    params.push(`%${query.search}%`);
    idx++;
  }

  const whereClause = `WHERE ${where.join(' AND ')}`;

  /* ---------- COUNT ---------- */
  const countSql = `
    SELECT COUNT(*)::int AS count
    FROM t_guest_inout io
    JOIN m_guest g
      ON g.guest_id = io.guest_id
    LEFT JOIN t_guest_room gr
      ON gr.guest_id = g.guest_id
    AND gr.is_active = TRUE
    LEFT JOIN t_guest_network gn
      ON gn.guest_id = g.guest_id
    AND gn.is_active = TRUE
    LEFT JOIN t_guest_messenger gm
      ON gm.guest_id = g.guest_id
    AND gm.is_active = TRUE
    ${whereClause};
  `;

  /* ---------- DATA ---------- */
  const dataSql = `
    SELECT
      g.guest_id,
      g.guest_name,

      /* -------- Room (from t_guest_room) -------- */
      r.room_id,
      r.room_no,

      /* -------- InOut Context -------- */
      io.entry_date,
      io.entry_time,
      io.status AS inout_status,

      /* -------- Network (may not exist) -------- */
      gn.guest_network_id,
      wp.provider_name,
      gn.network_status,
      gn.start_date,
      gn.start_time,
      gn.end_date,
      gn.end_time,

      /* -------- Messenger (may not exist) -------- */
      gm.guest_messenger_id,
      CASE 
        WHEN gm.guest_messenger_id IS NOT NULL THEN 'Assigned'
        ELSE NULL
      END AS messenger_status,
      gm.assignment_date,
      gm.remarks

    FROM t_guest_inout io
    JOIN m_guest g
      ON g.guest_id = io.guest_id

    LEFT JOIN t_guest_room gr
      ON gr.guest_id = g.guest_id
    AND gr.is_active = TRUE

    LEFT JOIN m_rooms r
      ON r.room_id = gr.room_id

    LEFT JOIN t_guest_network gn
      ON gn.guest_id = g.guest_id
    AND gn.is_active = TRUE

    LEFT JOIN m_wifi_provider wp
      ON wp.provider_id = gn.provider_id

    LEFT JOIN t_guest_messenger gm
      ON gm.guest_id = g.guest_id
    AND gm.is_active = TRUE

    ${whereClause}
    ORDER BY ${sortColumn} ${sortOrder}
    LIMIT $${idx} OFFSET $${idx + 1};
  `;

  const dataRes = await this.db.query(dataSql, [...params, limit, offset]);
  const countRes = await this.db.query(countSql, params);

  return {
    data: dataRes.rows,
    totalCount: countRes.rows[0].count,
  };
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

  // async changeStatus(
  //   id: string,
  //   dto: ChangeGuestNetworkStatusDto,
  //   user: string,
  //   ip: string
  // ) {
  //   const existing = await this.findOne(id);
  //   if (!existing) throw new Error('Not found');

  //   const now = new Date().toISOString();

  //   // 1. Close previous record
  //   await this.db.query(
  //     `
  //     UPDATE t_guest_network
  //     SET
  //       is_active = false,
  //       end_date = $1,
  //       end_time = $2,
  //       updated_at = $3,
  //       updated_by = $4,
  //       updated_ip = $5
  //     WHERE guest_network_id = $6
  //     `,
  //     [dto.end_date, dto.end_time, now, user, ip, id]
  //   );

  //   // 2. Insert new record (new fact)
  //   const newId = await this.generateId();

  //   const res = await this.db.query(
  //     `
  //     INSERT INTO t_guest_network (
  //       guest_network_id,
  //       guest_id,
  //       provider_id,
  //       room_id,
  //       start_date,
  //       start_time,
  //       network_status,
  //       start_status,
  //       is_active,
  //       inserted_at,
  //       inserted_by,
  //       inserted_ip
  //     )
  //     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,$9,$10,$11)
  //     RETURNING *;
  //     `,
  //     [
  //       newId,
  //       existing.guest_id,
  //       existing.provider_id,
  //       existing.room_id,
  //       dto.start_date,
  //       dto.start_time,
  //       dto.network_status,
  //       dto.start_status,
  //       now,
  //       user,
  //       ip,
  //     ]
  //   );

  //   return res.rows[0];
  // }
async closeAndCreateNext(
  id: string,
  dto: CloseGuestNetworkDto,
  user: string,
  ip: string
) {
  const existing = await this.findOne(id);
  if (!existing) throw new Error(`Guest Network '${id}' not found`);

  const now = new Date().toISOString();

  // 1. CLOSE OLD RECORD (NO DATA LOSS)
  await this.db.query(
    `
    UPDATE t_guest_network
    SET
      is_active = false,
      end_date = $1,
      end_time = $2,
      end_status = $3,
      network_status = $4,
      remarks = $5,
      updated_at = $6,
      updated_by = $7,
      updated_ip = $8
    WHERE guest_network_id = $9
    `,
    [
      dto.end_date,
      dto.end_time,
      dto.end_status,
      dto.network_status,
      dto.remarks ?? existing.remarks,
      now,
      user,
      ip,
      id,
    ]
  );

  // 2. CREATE NEW RECORD (NEW FACT)
  const newId = await this.generateId();

  const res = await this.db.query(
    `
    INSERT INTO t_guest_network (
      guest_network_id,
      guest_id,
      provider_id,
      room_id,
      network_zone_from,
      network_zone_to,
      start_date,
      start_time,
      start_status,
      network_status,
      description,
      remarks,
      is_active,
      inserted_at,
      inserted_by,
      inserted_ip
    )
    VALUES (
      $1,$2,$3,$4,
      $5,$6,
      $7,$8,
      'Waiting',
      'Requested',
      $9,$10,
      true,
      $11,$12,$13
    )
    RETURNING *;
    `,
    [
      newId,
      existing.guest_id,
      existing.provider_id,
      existing.room_id,
      existing.network_zone_from,
      existing.network_zone_to,
      existing.start_date,
      existing.start_time,
      existing.description,
      existing.remarks,
      now,
      user,
      ip,
    ]
  );

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
