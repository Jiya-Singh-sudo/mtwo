import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
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

  async getGuestNetworkTable(query: GuestNetworkTableQueryDto & { entryDateFrom?: string, entryDateTo?: string }) {
    const page = query.page;
    const limit = query.limit;
    const offset = (page - 1) * limit;
    // const { entryDateFrom, entryDateTo } = query;
    /* ---------- SORT WHITELIST ---------- */
    const SORT_MAP: Record<string, string> = {
      entry_date: 'io.entry_date',
      guest_name: 'g.guest_name',
      network_status: "COALESCE(gn.network_status, '')",
    };

    const sortColumn = SORT_MAP[query.sortBy ?? 'entry_date'] ?? 'io.entry_date';
    const sortOrder = query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    if (!Number.isInteger(query.page) || query.page <= 0) {
      throw new ConflictException('Page must be a positive integer');
    }

    if (!Number.isInteger(query.limit) || query.limit <= 0) {
      throw new ConflictException('Limit must be a positive integer');
    }

    if (query.limit > 100) {
      throw new ConflictException('Limit cannot exceed 100');
    }
    if (query.sortOrder && !['asc', 'desc'].includes(query.sortOrder)) {
      throw new ConflictException('Invalid sort order');
    }
    if (query.sortBy && !Object.keys(SORT_MAP).includes(query.sortBy)) {
      throw new ConflictException('Invalid sort column');
    }
    if (query.search && query.search.length > 100) {
      throw new ConflictException('Search text too long');
    }
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
    // /* ---------- DEFAULT ±15 DAY ENTRY WINDOW ---------- */
    // where.push(`
    //   io.entry_date BETWEEN
    //     (CURRENT_DATE - INTERVAL '15 days')
    //     AND
    //     (CURRENT_DATE + INTERVAL '15 days')
    // `);

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

    /* ---------- ENTRY DATE RANGE ---------- */
    const fromDate = query.entryDateFrom;
    const toDate = query.entryDateTo;
    if (fromDate && isNaN(Date.parse(fromDate))) {
      throw new ConflictException('Invalid entryDateFrom');
    }

    if (toDate && isNaN(Date.parse(toDate))) {
      throw new ConflictException('Invalid entryDateTo');
    }

    if (fromDate && toDate && fromDate > toDate) {
      throw new ConflictException('entryDateFrom must be before entryDateTo');
    }
    /* If no date filters provided → apply default window */
    if (!fromDate && !toDate) {
      // Default ±15 day window
      where.push(`
        io.entry_date BETWEEN
          (CURRENT_DATE - INTERVAL '15 days')
          AND
      (CURRENT_DATE + INTERVAL '15 days')
      `);
    } else {
      if (fromDate) {
        where.push(`io.entry_date >= $${idx}`);
        params.push(fromDate);
        idx++;
      }

  if (toDate) {
    // inclusive end-of-day logic
    where.push(`io.entry_date < ($${idx}::date + INTERVAL '1 day')`);
    params.push(toDate);
    idx++;
  }
    }
    /* ---------- BUILD WHERE CLAUSE AFTER ALL FILTERS ---------- */
    const whereClause = `WHERE ${where.join(' AND ')}`;
    /* ---------- COUNT ---------- */
    const countSql = `
      SELECT COUNT(DISTINCT g.guest_id)::int AS count
      FROM t_guest_inout io
      JOIN m_guest g 
        ON g.guest_id = io.guest_id
        AND g.is_active = TRUE

      LEFT JOIN t_guest_room gr
        ON gr.guest_id = g.guest_id
        AND gr.is_active = TRUE
        AND gr.check_out_date IS NULL

      LEFT JOIN t_guest_network gn 
        ON gn.guest_id = g.guest_id
        AND gn.room_id = gr.room_id
        AND gn.is_active = TRUE

      LEFT JOIN m_wifi_provider wp 
        ON wp.provider_id = gn.provider_id

      ${whereClause};
    `;
    // const countSql = `
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

    //   LEFT JOIN m_wifi_provider wp
    //     ON wp.provider_id = gn.provider_id   -- 🔥 ADD THIS

    //   LEFT JOIN t_guest_messenger gm
    //     ON gm.guest_id = g.guest_id
    //   AND gm.is_active = TRUE

    //   ${whereClause};
    // `;

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
        STRING_AGG(DISTINCT r.room_no, ', ') AS room_no,

        /* -------- InOut Context -------- */
        io.entry_date,
        io.entry_time,
        io.exit_date,
        io.exit_time,
        io.status AS inout_status,

        /* -------- Designation -------- */
        md.designation_name,
        gd.department,

        /* -------- Network -------- */
        wp.username,
        gn.provider_id,
        gn.network_status,
        gn.guest_network_id,
        wp.provider_name,
        gn.remarks,

        /* -------- Messenger -------- */
        gm.guest_messenger_id,
        CASE 
          WHEN gm.guest_messenger_id IS NOT NULL THEN 'Assigned'
          ELSE NULL
        END AS messenger_status,
        gm.assignment_date,
        gm.remarks AS messenger_remarks

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
        AND gn.room_id = gr.room_id
        AND gn.is_active = TRUE

      LEFT JOIN m_wifi_provider wp
        ON wp.provider_id = gn.provider_id

      LEFT JOIN t_guest_messenger gm
        ON gm.guest_id = g.guest_id
        AND gm.is_active = TRUE

      ${whereClause}

      GROUP BY
        g.guest_id,
        g.guest_name,
        gr.room_id,
        io.entry_date,
        io.entry_time,
        io.exit_date,
        io.exit_time,
        io.status,
        md.designation_name,
        gd.department,
        wp.username,
        gn.provider_id,
        gn.network_status,
        gn.guest_network_id,
        wp.provider_name,
        gn.remarks,
        gm.guest_messenger_id,
        gm.assignment_date,
        gm.remarks

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
    if (typeof activeOnly !== 'boolean') {
      throw new ConflictException('Invalid activeOnly flag');
    }
    const sql = activeOnly
      ? `SELECT * FROM t_guest_network WHERE is_active = $1 ORDER BY start_date DESC, start_time DESC`
      : `SELECT * FROM t_guest_network ORDER BY start_date DESC, start_time DESC`;
    const res = await this.db.query(sql, activeOnly ? [true] : []);
    return res.rows;
  }
  async findOne(id: string) {
    if (!/^GN\d+$/.test(id)) {
      throw new ConflictException('Invalid Guest Network ID format');
    }
    const sql = `SELECT * FROM t_guest_network WHERE guest_network_id = $1`;
    const res = await this.db.query(sql, [id]);
    if (!res.rowCount) {
      throw new NotFoundException(`Guest Network '${id}' not found`);
    }
    return res.rows[0];
  }
  async getActiveProviders() {
    const sql = `
      SELECT
        provider_id,
        provider_name,
        username
      FROM m_wifi_provider
      WHERE is_active = TRUE
      ORDER BY provider_name ASC
    `;

    const res = await this.db.query(sql);

    return res.rows;
  }
  async create(dto: CreateGuestNetworkDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      if (!/^G\d+$/.test(dto.guest_id)) {
        throw new ConflictException('Invalid guest ID format');
      }

      if (!/^N\d+$/.test(dto.provider_id)) {
        throw new ConflictException('Invalid provider ID format');
      }
      // Validate provider exists & active
      const provider = await client.query(
        `SELECT 1 FROM m_wifi_provider
        WHERE provider_id = $1
        AND is_active = TRUE`,
        [dto.provider_id]
      );

      if (!provider.rowCount) {
        throw new NotFoundException('Network provider not found or inactive');
      }

      const room = await client.query(`
        SELECT room_id
        FROM t_guest_room
        WHERE guest_id = $1
        AND is_active = TRUE
        AND check_out_date IS NULL
        LIMIT 1
      `, [dto.guest_id]);

      if (!room.rowCount) {
        throw new NotFoundException('Guest has no active room');
      }

      const roomId = room.rows[0].room_id;
      // Prevent duplicate active network for same guest + room
      const existing = await client.query(`
        SELECT 1
        FROM t_guest_network
        WHERE guest_id = $1
        AND room_id = $2
        AND is_active = TRUE
        LIMIT 1
      `, [dto.guest_id, roomId]);

      if (existing.rowCount > 0) {
        throw new ConflictException('Guest already has an active network for this room');
      }
      const allowedStatus = [
        'Requested',
        'Connected',
        'Disconnected',
        'Issue-Reported',
        'Resolved',
        'Cancelled'
      ];

      if (dto.network_status && !allowedStatus.includes(dto.network_status)) {
        throw new ConflictException('Invalid network status');
      }
      if (dto.remarks && dto.remarks.length > 255) {
        throw new ConflictException('Remarks cannot exceed 255 characters');
      }
      const activeNetwork = await client.query(`
        SELECT 1 FROM t_guest_network
        WHERE guest_id = $1
        AND is_active = TRUE
        FOR UPDATE
      `, [dto.guest_id]);

      if (activeNetwork.rowCount > 0) {
        throw new ConflictException('Guest already has an active network');
      }
      const id = await this.generateId(client);

      const sql = `
        INSERT INTO t_guest_network (
          guest_network_id,
          guest_id,
          room_id,
          provider_id,
          network_status,
          remarks,
          is_active,
          inserted_at,
          inserted_by,
          inserted_ip
        )
        VALUES ($1,$2,$3,$4,$5,TRUE,NOW(),$6,$7)
        RETURNING *;
      `;

      const params = [
        id,
        dto.guest_id,
        roomId,
        dto.provider_id,
        dto.network_status ?? 'Requested',
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
      if (!/^GN\d+$/.test(id)) {
        throw new ConflictException('Invalid Guest Network ID format');
      }
      const existing = await client.query(
        `SELECT * FROM t_guest_network WHERE guest_network_id = $1 AND is_active = true FOR UPDATE`,
        [id]
      );

      if (!existing.rowCount)
        throw new NotFoundException(`Guest Network entry '${id}' not found`);

      if (dto.provider_id) {
        const provider = await client.query(
          `SELECT 1 FROM m_wifi_provider
          WHERE provider_id = $1
          AND is_active = TRUE`,
          [dto.provider_id]
        );

        if (!provider.rowCount) {
          throw new NotFoundException('Network provider not found or inactive');
        }
      }
      if (dto.network_status) {
        const allowedStatus = [
          'Requested',
          'Connected',
          'Disconnected',
          'Issue-Reported',
          'Resolved',
          'Cancelled'
        ];

        if (!allowedStatus.includes(dto.network_status)) {
          throw new ConflictException('Invalid network status');
        }
      }
      if (dto.remarks && dto.remarks.length > 255) {
        throw new ConflictException('Remarks cannot exceed 255 characters');
      }
      const old = existing.rows[0];
      if (dto.is_active === true && old.is_active === false) {
        const duplicate = await client.query(`
          SELECT 1 FROM t_guest_network
          WHERE guest_id = $1
          AND room_id = $2
          AND is_active = TRUE
        `, [old.guest_id, old.room_id]);

        if (duplicate.rowCount > 0) {
          throw new ConflictException('Another active network already exists');
        }
      }
      const sql = `
        UPDATE t_guest_network SET
          provider_id = $1,
          room_id = $2,
          network_status = $3,
          remarks = $4,
          is_active = $5,
          updated_at = NOW(),
          updated_by = $6,
          updated_ip = $7
        WHERE guest_network_id = $8
        RETURNING *;
      `;

      const params = [
        dto.provider_id ?? old.provider_id,
        old.room_id,
        dto.network_status ?? old.network_status,
        dto.remarks ?? old.remarks,
        dto.is_active ?? old.is_active,
        user,
        ip,
        id,
      ];

      const res = await client.query(sql, params);
      return res.rows[0];
    });
  }
  async closeAndCreateNext(
    id: string,
    dto: CloseGuestNetworkDto,
    user: string,
    ip: string
  ) {
    return this.db.transaction(async (client) => {
      if (!/^GN\d+$/.test(id)) {
        throw new ConflictException('Invalid Guest Network ID format');
      }
      const existing = await client.query(
        `SELECT * FROM t_guest_network WHERE guest_network_id = $1 AND is_active = true FOR UPDATE`,
        [id]
      );
      if (!existing.rowCount) throw new NotFoundException(`Guest Network '${id}' not found`);
      if (!dto.end_date || isNaN(Date.parse(dto.end_date))) {
        throw new ConflictException('Invalid end date');
      }

      if (dto.end_time && !/^\d{2}:\d{2}$/.test(dto.end_time)) {
        throw new ConflictException('Invalid end time format');
      }
      const allowedStatus = [
        'Requested',
        'Connected',
        'Disconnected',
        'Issue-Reported',
        'Resolved',
        'Cancelled'
      ];

      if (!allowedStatus.includes(dto.network_status)) {
        throw new ConflictException('Invalid network status');
      }
      if (!existing.rows[0].is_active) {
        throw new ConflictException('Network already closed');
      }
      if (dto.remarks && dto.remarks.length > 255) {
        throw new ConflictException('Remarks cannot exceed 255 characters');
      }
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
          existing.description,
          existing.remarks,
          user,
          ip,
        ]
      );

      return res.rows[0];
    });
  }
  async closeNetwork(
    id: string,
    dto: CloseGuestNetworkDto,
    user: string,
    ip: string
  ) {
    return this.db.transaction(async (client) => {

      if (!/^GN\d+$/.test(id)) {
        throw new ConflictException('Invalid Guest Network ID format');
      }

      const existingRes = await client.query(
        `SELECT * FROM t_guest_network WHERE guest_network_id = $1 AND is_active = true FOR UPDATE`,
        [id]
      );

      if (!existingRes.rowCount) {
        throw new NotFoundException(`Guest Network '${id}' not found`);
      }

      const existing = existingRes.rows[0];

      if (!existing.is_active) {
        throw new ConflictException('Network already closed');
      }

      if (!dto.end_date || isNaN(Date.parse(dto.end_date))) {
        throw new ConflictException('Invalid end date');
      }

      if (dto.end_time && !/^\d{2}:\d{2}$/.test(dto.end_time)) {
        throw new ConflictException('Invalid end time format');
      }

      const allowedStatus = [
        'Requested',
        'Connected',
        'Disconnected',
        'Issue-Reported',
        'Resolved',
        'Cancelled'
      ];

      if (!allowedStatus.includes(dto.network_status)) {
        throw new ConflictException('Invalid network status');
      }

      if (dto.remarks && dto.remarks.length > 255) {
        throw new ConflictException('Remarks cannot exceed 255 characters');
      }

      const res = await client.query(
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
        RETURNING *;
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

      return res.rows[0];
    });
  }
  async softDelete(id: string, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      if (!/^GN\d+$/.test(id)) {
        throw new ConflictException('Invalid Guest Network ID format');
      }
      const existing = await client.query(
        `SELECT is_active FROM t_guest_network WHERE guest_network_id = $1 AND is_active = true FOR UPDATE`,
        [id]
      );
      if (!existing.rowCount) throw new NotFoundException(`Guest Network '${id}' not found`);
      if (!existing.rows[0].is_active) {
        throw new ConflictException('Network already inactive');
      }
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
