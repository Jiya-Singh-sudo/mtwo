import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateGuestNetworkDto } from "./dto/create-guest-network.dto";
import { GuestNetworkTableQueryDto } from "./dto/guest-network-table-query.dto";
import { CloseGuestNetworkDto } from "./dto/close-guest-network.dto";
import { UpdateGuestNetworkDto } from "./dto/update-guest-network.dto";
import { ChangeGuestNetworkStatusDto } from "./dto/changes-guest-network-status.dto";

@Injectable()
export class GuestNetworkService {
  constructor(private readonly db: DatabaseService) { }
  private async generateId(client: any): Promise<string> {
    const res = await client.query(`
      SELECT 'GN' || LPAD(nextval('guest_network_seq')::text, 3, '0') AS id
    `);
    return res.rows[0].id;
  }

  // private async generateId(): Promise<string> {
  //   const sql = `SELECT guest_network_id FROM t_guest_network ORDER BY guest_network_id DESC LIMIT 1`;
  //   const res = await this.db.query(sql);
  //   if (res.rows.length === 0) return "GN001";
  //   const last = res.rows[0].guest_network_id.replace("GN", "");
  //   const next = (parseInt(last, 10) + 1).toString().padStart(3, "0");
  //   return `GN${next}`;
  // }
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

      LEFT JOIN m_wifi_provider wp
        ON wp.provider_id = gn.provider_id   -- 🔥 ADD THIS

      LEFT JOIN t_guest_messenger gm
        ON gm.guest_id = g.guest_id
      AND gm.is_active = TRUE

      ${whereClause};
    `;

  //   const countSql = `
  //   SELECT COUNT(*)::int AS count
  //   FROM t_guest_inout io
  //   JOIN m_guest g
  //     ON g.guest_id = io.guest_id
  //   LEFT JOIN t_guest_room gr
  //     ON gr.guest_id = g.guest_id
  //   AND gr.is_active = TRUE
  //   LEFT JOIN t_guest_network gn
  //     ON gn.guest_id = g.guest_id
  //   AND gn.is_active = TRUE
  //   LEFT JOIN t_guest_messenger gm
  //     ON gm.guest_id = g.guest_id
  //   AND gm.is_active = TRUE
  //   ${whereClause};
  // `;

    /* ---------- DATA ---------- */
    const dataSql = `
      SELECT
        g.guest_id,
        g.guest_name,

        /* -------- Room -------- */
        gr.room_id,
        r.room_no,

        /* -------- InOut Context -------- */
        io.entry_date,
        io.entry_time,
        io.exit_date,
        io.exit_time,
        io.status AS inout_status,

        /* -------- Designation -------- */
        md.designation_name,
        gd.department,

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
      AND g.is_active = TRUE

      LEFT JOIN t_guest_room gr
        ON gr.guest_id = g.guest_id
      AND gr.is_active = TRUE
      AND gr.check_out_date IS NULL

      LEFT JOIN m_rooms r
        ON r.room_id = gr.room_id
      AND r.is_active = TRUE

      LEFT JOIN t_guest_designation gd
        ON gd.guest_id = g.guest_id
      AND gd.is_current = TRUE
      AND gd.is_active = TRUE

      LEFT JOIN m_guest_designation md
        ON md.designation_id = gd.designation_id
      AND md.is_active = TRUE

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

    // const dataSql = `
    //   SELECT
    //     g.guest_id,
    //     g.guest_name,

    //     /* -------- Room (from t_guest_room) -------- */
    //     gr.room_id,
    //     gr.room_no,

    //     /* -------- InOut Context -------- */
    //     io.entry_date,
    //     io.entry_time,
    //     io.exit_date,
    //     io.exit_time,
    //     io.status AS inout_status,

    //     /* -------- Designation -------- */
    //     md.designation_name,
    //     gd.department,

    //     /* -------- Network (may not exist) -------- */
    //     gn.guest_network_id,
    //     wp.provider_name,
    //     gn.network_status,
    //     gn.start_date,
    //     gn.start_time,
    //     gn.end_date,
    //     gn.end_time,

    //     /* -------- Messenger (may not exist) -------- */
    //     gm.guest_messenger_id,
    //     CASE 
    //       WHEN gm.guest_messenger_id IS NOT NULL THEN 'Assigned'
    //       ELSE NULL
    //     END AS messenger_status,
    //     gm.assignment_date,
    //     gm.remarks

    //   FROM t_guest_inout io

    //   JOIN m_guest g
    //     ON g.guest_id = io.guest_id
    //   AND g.is_active = TRUE

    //   LEFT JOIN t_guest_room gr
    //     ON gr.guest_id = g.guest_id
    //   AND gr.is_active = TRUE
    //   AND gr.check_out_date IS NULL

    //   LEFT JOIN t_guest_designation gd
    //     ON gd.guest_id = g.guest_id
    //   AND gd.is_current = TRUE
    //   AND gd.is_active = TRUE

    //   LEFT JOIN m_guest_designation md
    //     ON md.designation_id = gd.designation_id
    //   AND md.is_active = TRUE

    //   LEFT JOIN t_guest_network gn
    //     ON gn.guest_id = g.guest_id
    //   AND gn.is_active = TRUE

    //   LEFT JOIN m_wifi_provider wp
    //     ON wp.provider_id = gn.provider_id

    //   LEFT JOIN t_guest_messenger gm
    //     ON gm.guest_id = g.guest_id
    //   AND gm.is_active = TRUE

    //   ${whereClause}

    //   ORDER BY ${sortColumn} ${sortOrder}
    //   LIMIT $${idx} OFFSET $${idx + 1};
    // `;

    const statsSql = `
    SELECT
      COUNT(*)::int AS total,
      COUNT(CASE WHEN gn.network_status = 'Requested' THEN 1 END)::int AS requested,
      COUNT(CASE WHEN gn.network_status = 'Connected' THEN 1 END)::int AS connected,
      COUNT(CASE WHEN gn.network_status = 'Disconnected' THEN 1 END)::int AS disconnected,
      COUNT(CASE WHEN gn.network_status = 'Issue-Reported' THEN 1 END)::int AS issue_reported,
      COUNT(CASE WHEN gn.network_status = 'Resolved' THEN 1 END)::int AS resolved,
      COUNT(CASE WHEN gn.network_status = 'Cancelled' THEN 1 END)::int AS cancelled,
      (SELECT COUNT(*)::int FROM t_guest_messenger gm WHERE gm.is_active = TRUE) AS messenger_assigned
    FROM t_guest_network gn
    WHERE gn.is_active = TRUE;
  `;

    const dataRes = await this.db.query(dataSql, [...params, limit, offset]);
    const countRes = await this.db.query(countSql, params);
    const statsRes = await this.db.query(statsSql);

    return {
      data: dataRes.rows,
      totalCount: countRes.rows[0].count,
      stats: {
        total: parseInt(statsRes.rows[0].total, 10) || 0,
        requested: parseInt(statsRes.rows[0].requested, 10) || 0,
        connected: parseInt(statsRes.rows[0].connected, 10) || 0,
        disconnected: parseInt(statsRes.rows[0].disconnected, 10) || 0,
        issueReported: parseInt(statsRes.rows[0].issue_reported, 10) || 0,
        resolved: parseInt(statsRes.rows[0].resolved, 10) || 0,
        cancelled: parseInt(statsRes.rows[0].cancelled, 10) || 0,
        messengerAssigned: parseInt(statsRes.rows[0].messenger_assigned, 10) || 0,
      },
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
    return this.db.transaction(async (client) => {
      const id = await this.generateId(client);
      const sql = `
      INSERT INTO t_guest_network (
        guest_network_id, guest_id, provider_id, room_id,
        network_zone_from, network_zone_to,
        start_status, end_status, network_status,
        description, remarks,
        is_active,
        inserted_at, inserted_by, inserted_ip
      ) VALUES (
        $1,$2,$3,$4,
        $5,$6,
        $7,$8,$9,
        $10,$11,
        true, NOW(), $12, $13
      ) RETURNING *;
    `;

    const params = [
      id,
      dto.guest_id,
      dto.provider_id,
      dto.room_id ?? null,
      dto.network_zone_from ?? null,
      dto.network_zone_to ?? null,
      dto.start_status ?? "Waiting",
      dto.end_status ?? "Waiting",
      dto.network_status ?? "Requested",
      dto.description ?? null,
      dto.remarks ?? null,
      user,
      ip,
    ];

    const res = await client.query(sql, params);
    return res.rows[0];
    });
  }

  async update(id: string, dto: UpdateGuestNetworkDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      const existing = await client.query(
        `SELECT * FROM t_guest_network WHERE guest_network_id = $1 FOR UPDATE`,
        [id]
      );
      if (!existing.rowCount) throw new NotFoundException(`Guest Network entry '${id}' not found`);
      const old = existing.rows[0];

      const sql = `
        UPDATE t_guest_network SET
          provider_id = $1,
          room_id = $2,
          network_zone_from = $3,
          network_zone_to = $4,
          start_status = $5,
          end_status = $6,
          network_status = $7,
          description = $8,
          remarks = $9,
          is_active = $10,
          updated_at = NOW(),
          updated_by = $11,
          updated_ip = $12
        WHERE guest_network_id = $13
        RETURNING *;
      `;

      const params = [
        dto.provider_id ?? old.provider_id,
        dto.room_id ?? existing.room_id,
        dto.network_zone_from ?? existing.network_zone_from,
        dto.network_zone_to ?? existing.network_zone_to,
        dto.start_status ?? existing.start_status,
        dto.end_status ?? existing.end_status,
        dto.network_status ?? existing.network_status,
        dto.description ?? existing.description,
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
    return this.db.transaction(async (client) => {

      const existing = await client.query(
        `SELECT * FROM t_guest_network WHERE guest_network_id = $1 FOR UPDATE`,
        [id]
      );
      if (!existing.rowCount) throw new NotFoundException(`Guest Network '${id}' not found`);

      // 1. CLOSE OLD RECORD (NO DATA LOSS)
      await client.query(
        `
      UPDATE t_guest_network
      SET
        is_active = false,
        end_date = $1,
        end_time = $2,
        end_status = $3,
        network_status = $4,
        remarks = $5,
        updated_at = NOW(),
        updated_by = $6,
        updated_ip = $7
      WHERE guest_network_id = $8
      `,
        [
          dto.end_date,
          dto.end_time,
          dto.end_status,
          dto.network_status,
          dto.remarks ?? existing.remarks,
          user,
          ip,
          id,
        ]
      );

      // 2. CREATE NEW RECORD (NEW FACT)
      const newId = await this.generateId(client);

      const res = await client.query(
        `
      INSERT INTO t_guest_network (
        guest_network_id,
        guest_id,
        provider_id,
        room_id,
        network_zone_from,
        network_zone_to,
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
        'Requested',
        $7,$8,
        true, NOW(),
        $9,$10
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
          user,
          ip,
        ]
      );

      return res.rows[0];
    });
  }

  async softDelete(id: string, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      const existing = await client.query(
        `SELECT 1 FROM t_guest_network WHERE guest_network_id = $1 FOR UPDATE`,
        [id]
      );
      if (!existing.rowCount) throw new NotFoundException(`Guest Network '${id}' not found`);

      const sql = `
      UPDATE t_guest_network SET
        is_active = false,
        updated_at = NOW(),
        updated_by = $1,
        updated_ip = $2
      WHERE guest_network_id = $3
      RETURNING *;
      `;
      const res = await client.query(sql, [user, ip, id]);
      return res.rows[0];
    });
  }
} 
