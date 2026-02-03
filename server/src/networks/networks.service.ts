import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateNetworkDto } from './dto/create-network.dto';
import { UpdateNetworkDto } from './dto/update-network.dto';
import { NetworkTableQueryDto } from './dto/network-table-query.dto';
import { sha256 } from '../../common/utlis/hash.util';

@Injectable()
export class NetworksService {
  constructor(private readonly db: DatabaseService) { }
  private async generateProviderId(): Promise<string> {
    const sql = `
      SELECT provider_id
      FROM m_wifi_provider
      WHERE provider_id ~ '^N[0-9]+$'
      ORDER BY CAST(SUBSTRING(provider_id, 2) AS INT) DESC
      LIMIT 1;
    `;

    const res = await this.db.query(sql);

    if (res.rows.length === 0) {
      return 'N001';
    }

    const lastId = res.rows[0].provider_id;
    const nextNum = parseInt(lastId.substring(1), 10) + 1;
    return `N${nextNum.toString().padStart(3, '0')}`;
  }

  async getNetworkTable(query: NetworkTableQueryDto) {
    const page = query.page;
    const limit = query.limit;
    const offset = (page - 1) * limit;

    /* ---------- SORT WHITELIST ---------- */
    const SORT_MAP: Record<string, string> = {
      provider_name: 'provider_name',
      network_type: 'network_type',
      bandwidth_mbps: 'bandwidth_mbps',
      inserted_at: 'inserted_at',
    };

    const sortColumn =
      SORT_MAP[query.sortBy ?? 'provider_name'] ?? 'provider_name';

    const sortOrder = query.sortOrder === 'desc' ? 'DESC' : 'ASC';

    /* ---------- FILTERS ---------- */
    const where: string[] = [];
    const params: any[] = [];

    // status → is_active
    if (query.status === 'active') {
      where.push('is_active = true');
    } else if (query.status === 'inactive') {
      where.push('is_active = false');
    }

    // search → provider_name
    if (query.search) {
      params.push(`%${query.search}%`);
      where.push(`provider_name ILIKE $${params.length}`);
    }

    const whereClause =
      where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    /* ---------- DATA QUERY ---------- */
    const dataSql = `
      SELECT
        provider_id,
        provider_name,
        provider_name_local_language,
        network_type,
        bandwidth_mbps,
        username,
        static_ip,
        address,
        is_active,
        inserted_at,
        updated_at
      FROM m_wifi_provider
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2};
    `;

    const dataParams = [...params, limit, offset];

    /* ---------- COUNT QUERY ---------- */
    const countSql = `
      SELECT COUNT(*)::int AS count
      FROM m_wifi_provider
      ${whereClause};
    `;

    const statsSql = `
      SELECT
        COUNT(*)::int AS total,
        COUNT(CASE WHEN network_type = 'WiFi' THEN 1 END)::int AS wifi,
        COUNT(CASE WHEN network_type = 'Broadband' THEN 1 END)::int AS broadband,
        COUNT(CASE WHEN network_type = 'Hotspot' THEN 1 END)::int AS hotspot,
        COUNT(CASE WHEN network_type = 'Leased-Line' THEN 1 END)::int AS leased_line
      FROM m_wifi_provider
      WHERE is_active = TRUE;
    `;

    const dataRes = await this.db.query(dataSql, dataParams);
    const countRes = await this.db.query(countSql, params);
    const statsRes = await this.db.query(statsSql);

    return {
      data: dataRes.rows,
      totalCount: countRes.rows[0].count,
      stats: {
        total: parseInt(statsRes.rows[0].total, 10) || 0,
        wifi: parseInt(statsRes.rows[0].wifi, 10) || 0,
        broadband: parseInt(statsRes.rows[0].broadband, 10) || 0,
        hotspot: parseInt(statsRes.rows[0].hotspot, 10) || 0,
        leasedLine: parseInt(statsRes.rows[0].leased_line, 10) || 0,
      },
    };
  }

  async findOneById(id: string) {
    const sql = `SELECT * FROM m_wifi_provider WHERE provider_id = $1`;
    const res = await this.db.query(sql, [id]);
    return res.rows[0];
  }

  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `SELECT * FROM m_wifi_provider WHERE is_active = $1 ORDER BY provider_name`
      : `SELECT * FROM m_wifi_provider ORDER BY provider_name`;

    const res = await this.db.query(sql, activeOnly ? [true] : []);
    return res.rows;
  }

  // async findOneByName(name: string) {
  //   const sql = `SELECT * FROM m_wifi_provider WHERE provider_name = $1`;
  //   const res = await this.db.query(sql, [name]);
  //   return res.rows[0];
  // }

  async create(dto: CreateNetworkDto, user: string, ip: string) {
    const now = new Date()
      .toLocaleString('en-GB', { hour12: false, timeZone: 'Asia/Kolkata' })
      .replace(',', '');
    const providerId = await this.generateProviderId();
    const hashedPassword = dto.password
      ? sha256(dto.password)
      : null;
    // 🔴 Duplicate provider name check
    const duplicate = await this.db.query(
      `
      SELECT 1
      FROM m_wifi_provider
      WHERE LOWER(provider_name) = LOWER($1)
        AND is_active = TRUE
      LIMIT 1
      `,
      [dto.provider_name]
    );

    if (duplicate.rowCount > 0) {
      throw new BadRequestException(
        `Network provider '${dto.provider_name}' already exists`
      );
    }
    const sql = `
      INSERT INTO m_wifi_provider (
        provider_id,
        provider_name,
        provider_name_local_language,
        network_type,
        bandwidth_mbps,
        username,
        password,
        static_ip,
        address,
        is_active,
        inserted_at, inserted_by, inserted_ip,
        updated_at, updated_by, updated_ip
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,$10,$11,$12,NULL,NULL,NULL)
      RETURNING
        provider_id,
        provider_name,
        provider_name_local_language,
        network_type,
        bandwidth_mbps,
        username,
        static_ip,
        address,
        is_active,
        inserted_at,
        updated_at;
    `;

    const params = [
      providerId,
      dto.provider_name,
      dto.provider_name_local_language ?? null,
      dto.network_type,
      dto.bandwidth_mbps ?? null,
      dto.username ?? null,
      hashedPassword,
      dto.static_ip ?? null,
      dto.address ?? null,
      now,
      user,
      ip,
    ];

    const res = await this.db.query(sql, params);
    return res.rows[0];
  }

  async update(id: string, dto: UpdateNetworkDto, user: string, ip: string) {
    const existing = await this.findOneById(id);
    if (!existing) throw new Error(`Provider '${id}' not found`);

    const now = new Date()
      .toLocaleString('en-GB', { hour12: false, timeZone: 'Asia/Kolkata' })
      .replace(',', '');
    const passwordToStore =
      dto.password !== undefined
        ? sha256(dto.password)
        : existing.password;
    if (dto.provider_name) {
      const duplicate = await this.db.query(
        `
        SELECT 1
        FROM m_wifi_provider
        WHERE LOWER(provider_name) = LOWER($1)
          AND provider_id <> $2
          AND is_active = TRUE
        LIMIT 1
        `,
        [dto.provider_name, id]
      );

      if (duplicate.rowCount > 0) {
        throw new BadRequestException(
          `Network provider '${dto.provider_name}' already exists`
        );
      }
    }
    if (dto.network_type && dto.network_type !== existing.network_type) {
      const assigned = await this.db.query(
        `
        SELECT 1
        FROM t_guest_network
        WHERE provider_id = $1
          AND is_active = TRUE
        LIMIT 1
        `,
        [id]
      );

      if (assigned.rowCount > 0) {
        throw new BadRequestException(
          'Cannot change network type while provider is assigned to a guest'
        );
      }
    }
    const sql = `
      UPDATE m_wifi_provider SET
        provider_name = $1,
        provider_name_local_language = $2,
        network_type = $3,
        bandwidth_mbps = $4,
        username = $5,
        password = $6,
        static_ip = $7,
        address = $8,
        is_active = $9,
        updated_at = $10,
        updated_by = $11,
        updated_ip = $12
      WHERE provider_id = $13
      RETURNING
        provider_id,
        provider_name,
        provider_name_local_language,
        network_type,
        bandwidth_mbps,
        username,
        static_ip,
        address,
        is_active,
        inserted_at,
        updated_at;
      `;

    const params = [
      dto.provider_name ?? existing.provider_name,
      dto.provider_name_local_language ?? existing.provider_name_local_language,
      dto.network_type ?? existing.network_type,
      dto.bandwidth_mbps ?? existing.bandwidth_mbps,
      dto.username ?? existing.username,
      passwordToStore,
      dto.static_ip ?? existing.static_ip,
      dto.address ?? existing.address,
      dto.is_active ?? existing.is_active,
      now,
      user,
      ip,
      existing.provider_id,
    ];

    const res = await this.db.query(sql, params);
    return res.rows[0];
  }

  async softDelete(id: string, user: string, ip: string) {
    const existing = await this.findOneById(id);
    if (!existing) {
      throw new BadRequestException(`Provider '${id}' not found`);
    }

    // 🔴 BLOCK DELETE IF ASSIGNED TO ANY GUEST
    const assigned = await this.db.query(
      `
      SELECT 1
      FROM t_guest_network
      WHERE provider_id = $1
        AND is_active = TRUE
      LIMIT 1
      `,
      [id]
    );

    if (assigned.rowCount > 0) {
      throw new BadRequestException(
        `Cannot delete network provider '${existing.provider_name}' because it is currently assigned to a guest`
      );
    }

    // ✅ SAFE TO DELETE
    const now = new Date()
    .toLocaleString('en-GB', { hour12: false, timeZone: 'Asia/Kolkata' })
    .replace(',', '');

    const sql = `
      UPDATE m_wifi_provider SET
        is_active = FALSE,
        updated_at = $1,
        updated_by = $2,
        updated_ip = $3
      WHERE provider_id = $4
      RETURNING *;
    `;

    const res = await this.db.query(sql, [
      now,
      user,
      ip,
      existing.provider_id,
    ]);

    return res.rows[0];
  }
}
