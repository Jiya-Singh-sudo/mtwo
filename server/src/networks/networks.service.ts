import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateNetworkDto } from './dto/create-network.dto';
import { UpdateNetworkDto } from './dto/update-network.dto';
import { NetworkTableQueryDto } from './dto/network-table-query.dto';
import { sha256 } from '../../common/utlis/hash.util';
import { ActivityLogService } from '../activity-log/activity-log.service';
@Injectable()
export class NetworksService {
  constructor(private readonly db: DatabaseService, private readonly activityLog: ActivityLogService) { }
  private async generateProviderId(client: any): Promise<string> {
    const res = await client.query(`
      SELECT 'N' || LPAD(nextval('wifi_provider_seq')::text, 3, '0') AS id
    `);
    return res.rows[0].id;
  }

  async getNetworkTable(query: NetworkTableQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const offset = (page - 1) * limit;

    /* ---------- SORT WHITELIST ---------- */
    const SORT_MAP: Record<string, string> = {
      provider_name: 'provider_name',
      network_type: 'network_type',
      bandwidth_mbps: 'bandwidth_mbps',
      inserted_at: 'inserted_at',
    };
    if (query.sortBy && !Object.keys(SORT_MAP).includes(query.sortBy)) {
      throw new BadRequestException('Invalid sort field');
    }
    const sortColumn =
      SORT_MAP[query.sortBy ?? 'provider_name'] ?? 'provider_name';
    const sortOrder = query.sortOrder === 'desc' ? 'DESC' : 'ASC';
    /* ---------- FILTERS ---------- */
    const where: string[] = [];
    const params: any[] = [];

    /* ---------- STATUS FILTER ---------- */
    const allowedStatus = ['active', 'inactive', 'all'];

    if (query.status && !allowedStatus.includes(query.status)) {
      throw new BadRequestException('Invalid status filter');
    }

    if (query.status === 'active') {
      where.push('is_active = true');
    } else if (query.status === 'inactive') {
      where.push('is_active = false');
    }
    // if "all" → do nothing

    /* ---------- NETWORK TYPE FILTER ---------- */
    // if (query.networkType) {
    //   const allowedTypes = ['WiFi','Broadband','Hotspot','Leased-Line'];

    //   if (!allowedTypes.includes(query.networkType)) {
    //     throw new BadRequestException('Invalid network type filter');
    //   }

    //   params.push(query.networkType);
    //   where.push(`network_type = $${params.length}`);
    // }

    /* ---------- SEARCH FILTER ---------- */
    // if (query.search) {
    //   if (query.search.length > 100) {
    //     throw new BadRequestException('Search text too long');
    //   }

    //   params.push(`%${query.search}%`);
    //   const index = params.length;

    //   where.push(`
    //     (
    //       provider_name ILIKE $${index}
    //       OR network_type::text ILIKE $${index}
    //       OR CAST(bandwidth_mbps AS TEXT) ILIKE $${index}
    //     )
    //   `);
    // }

    /* ---------- BUILD WHERE CLAUSE (IMPORTANT: AFTER filters) ---------- */
    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    if (!Number.isInteger(query.page) || query.page <= 0) {
      throw new BadRequestException('Page must be a positive integer');
    }

    if (!Number.isInteger(query.limit) || query.limit <= 0) {
      throw new BadRequestException('Limit must be a positive integer');
    }

    if (query.limit > 100) {
      throw new BadRequestException('Limit cannot exceed 100');
    }
    if (query.sortOrder && !['asc', 'desc'].includes(query.sortOrder)) {
      throw new BadRequestException('Invalid sort order');
    }
    // search → provider_name, network_type, bandwidth
    if (query.search) {
      const search = query.search.trim();

      if (!search) {
        throw new BadRequestException('Search cannot be empty');
      }

      if (search.length > 100) {
        throw new BadRequestException('Search text too long');
      }

      params.push(`%${search}%`);
      const index = params.length;

      where.push(`
        (
          provider_name ILIKE $${index}
          OR network_type::text ILIKE $${index}
          OR CAST(bandwidth_mbps AS TEXT) ILIKE $${index}
        )
      `);
    }
    /* ---------- DATA QUERY ---------- */
    const dataSql = `
      SELECT
        provider_id,
        provider_name,
        provider_name_local_language,
        network_type,
        username,
        is_active
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

        -- Status-based counts
        COUNT(CASE WHEN is_active = TRUE THEN 1 END)::int AS active,
        COUNT(CASE WHEN is_active = FALSE THEN 1 END)::int AS inactive,

        -- Network-type counts (ACTIVE only)
        COUNT(CASE WHEN network_type = 'WiFi' AND is_active = TRUE THEN 1 END)::int AS wifi,
        COUNT(CASE WHEN network_type = 'Broadband' AND is_active = TRUE THEN 1 END)::int AS broadband,
        COUNT(CASE WHEN network_type = 'Hotspot' AND is_active = TRUE THEN 1 END)::int AS hotspot,
        COUNT(CASE WHEN network_type = 'Leased-Line' AND is_active = TRUE THEN 1 END)::int AS leased_line
      FROM m_wifi_provider;
    `;

    const dataRes = await this.db.query(dataSql, dataParams);
    const countRes = await this.db.query(countSql, params);
    const statsRes = await this.db.query(statsSql);

    return {
      data: dataRes.rows,
      totalCount: countRes.rows[0].count,
      stats: {
        total: parseInt(statsRes.rows[0].total, 10) || 0,

        active: parseInt(statsRes.rows[0].active, 10) || 0,
        inactive: parseInt(statsRes.rows[0].inactive, 10) || 0,

        wifi: parseInt(statsRes.rows[0].wifi, 10) || 0,
        broadband: parseInt(statsRes.rows[0].broadband, 10) || 0,
        hotspot: parseInt(statsRes.rows[0].hotspot, 10) || 0,
        leasedLine: parseInt(statsRes.rows[0].leased_line, 10) || 0,
      },
    };
  }

  async findOneById(id: string) {
    if (!/^N\d+$/.test(id)) {
      throw new BadRequestException('Invalid provider ID format');
    }
    const sql = `SELECT * FROM m_wifi_provider WHERE provider_id = $1`;
    const res = await this.db.query(sql, [id]);
    if (!res.rowCount) {
      throw new NotFoundException(`Provider '${id}' not found`);
    }
    return res.rows[0];
  }

  async findAll(activeOnly = true) {
    if (typeof activeOnly !== 'boolean') {
      throw new BadRequestException('Invalid activeOnly flag');
    }
    const sql = activeOnly
      ? `SELECT * FROM m_wifi_provider WHERE is_active = $1 ORDER BY provider_name`
      : `SELECT * FROM m_wifi_provider ORDER BY provider_name`;

    const res = await this.db.query(sql, activeOnly ? [true] : []);
    return res.rows;
  }

  async create(dto: CreateNetworkDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      const providerId = await this.generateProviderId(client);
      const hashedPassword = dto.password ? sha256(dto.password) : null;
      // Normalize input
      const providerName = dto.provider_name?.trim();
      const username = dto.username?.trim() || null;

      if (providerName.length > 100) {
        throw new BadRequestException('Provider name cannot exceed 100 characters');
      }

      if (!providerName) {
        throw new BadRequestException('Provider name is required');
      }
      if (username && username.length > 100) {
        throw new BadRequestException('Username cannot exceed 100 characters');
      }
      if (!['WiFi','Broadband','Hotspot','Leased-Line'].includes(dto.network_type)) {
        throw new BadRequestException('Invalid network type');
      }

      if (username && !dto.password) {
        throw new BadRequestException('Password required when username is provided');
      }
      if (dto.password && !username) {
        throw new BadRequestException('Username required when password is provided');
      }
      if (username) {
        const userExists = await client.query(
          `
          SELECT 1
          FROM m_wifi_provider
          WHERE LOWER(username) = LOWER($1)
            AND is_active = TRUE
          LIMIT 1
          `,
          [username]
        );

        if (userExists.rowCount > 0) {
          throw new BadRequestException('Username already exists');
        }
      }
      if (dto.password) {
        const strongPassword =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

        if (!strongPassword.test(dto.password)) {
          throw new BadRequestException(
            'Password must be at least 8 characters and include uppercase, lowercase, and number'
          );
        }
      }
      if (!providerName) {
        throw new BadRequestException('Provider name is required');
      }
      // 🔴 Duplicate provider name check
      const duplicate = await client.query(
        `
        SELECT 1
        FROM m_wifi_provider
        WHERE LOWER(provider_name) = LOWER($1)
          AND is_active = TRUE
        FOR UPDATE
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
          username,
          password,
          is_active,
          inserted_at, inserted_by, inserted_ip,
          updated_at, updated_by, updated_ip
        )
        VALUES ($1,$2,$3,$4,$5,$6,true,NOW(),$7,$8,NULL,NULL,NULL)
        RETURNING *
      `;

      const params = [
        providerId,
        dto.provider_name,
        dto.provider_name_local_language ?? null,
        dto.network_type,
        dto.username ?? null,
        hashedPassword,
        user,
        ip,
      ];

      const res = await client.query(sql, params);
      await this.activityLog.log({
        message: 'New Network provider created successfully',
        module: 'NETWORK',
        action: 'CREATE',
        referenceId: providerId,
        performedBy: user,
        ipAddress: ip,
      }, client);
      return res.rows[0];
    });
  }

  async update(id: string, dto: UpdateNetworkDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      if (!/^N\d+$/.test(id)) {
        throw new BadRequestException('Invalid provider ID format');
      }
      if (dto.is_active !== undefined && typeof dto.is_active !== 'boolean') {
        throw new BadRequestException('Invalid is_active value');
      }
      const existingRes = await client.query(
        `SELECT * FROM m_wifi_provider WHERE provider_id = $1 AND is_active = true FOR UPDATE`,
        [id],
      );
      if (!existingRes.rowCount) {
        throw new NotFoundException(`Provider '${id}' not found`);
      }

      const providerName = dto.provider_name?.trim();
      const username = dto.username?.trim();
      if (dto.network_type) {
        if (!['WiFi','Broadband','Hotspot','Leased-Line'].includes(dto.network_type)) {
          throw new BadRequestException('Invalid network type');
        }
      }

      if (dto.password) {
        const strongPassword =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

        if (!strongPassword.test(dto.password)) {
          throw new BadRequestException(
            'Password must be at least 8 characters and include uppercase, lowercase, and number'
          );
        }
      }
      if (providerName && providerName.length > 100) {
        throw new BadRequestException('Provider name cannot exceed 100 characters');
      }

      if (dto.username && dto.username.length > 100) {
        throw new BadRequestException('Username cannot exceed 100 characters');
      }
      if (dto.username) {
        const duplicateUser = await client.query(
          `
          SELECT 1
          FROM m_wifi_provider
          WHERE LOWER(username) = LOWER($1)
            AND provider_id <> $2
            AND is_active = TRUE
          LIMIT 1
          `,
          [dto.username, id]
        );

        if (duplicateUser.rowCount > 0) {
          throw new BadRequestException('Username already exists');
        }
      }

      if (dto.username && dto.password === null) {
        throw new BadRequestException('Password cannot be removed while username exists');
      }
      const existing = existingRes.rows[0];
      if (username && dto.password === null) {
        throw new BadRequestException('Password cannot be removed while username exists');
      }

      if (dto.password && !username && !existing.username) {
        throw new BadRequestException('Username required when password is provided');
      }

      if (dto.is_active === true && existing.is_active === false) {
        const nameConflict = await client.query(
          `
          SELECT 1
          FROM m_wifi_provider
          WHERE LOWER(provider_name) = LOWER($1)
            AND provider_id <> $2
            AND is_active = TRUE
          `,
          [existing.provider_name, id]
        );

        if (nameConflict.rowCount > 0) {
          throw new BadRequestException('Cannot reactivate due to duplicate provider name');
        }
      }
      if (dto.is_active === false && existing.is_active === true) {
        const assigned = await client.query(`
          SELECT 1
          FROM t_guest_network
          WHERE provider_id = $1
            AND is_active = TRUE
          LIMIT 1
        `, [id]);

        if (assigned.rowCount > 0) {
          throw new BadRequestException(
            'Cannot deactivate provider while assigned to a guest'
          );
        }
      }

      const passwordToStore =
        dto.password !== undefined
          ? sha256(dto.password)
          : existing.password;
      if (dto.provider_name) {
        const duplicate = await client.query(
          `
          SELECT 1
          FROM m_wifi_provider
          WHERE LOWER(provider_name) = LOWER($1)
            AND provider_id <> $2
            AND is_active = TRUE
          FOR UPDATE
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
        const assigned = await client.query(
          `
          SELECT 1
          FROM t_guest_network
          WHERE provider_id = $1
            AND is_active = TRUE

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
          username = $4,
          password = $5,
          is_active = $6,
          updated_at = NOW(),
          updated_by = $7,
          updated_ip = $8
        WHERE provider_id = $9
        RETURNING *;
        `;

      const params = [
        dto.provider_name ?? existing.provider_name,
        dto.provider_name_local_language ?? existing.provider_name_local_language,
        dto.network_type ?? existing.network_type,
        dto.username ?? existing.username,
        passwordToStore,
        dto.is_active ?? existing.is_active,
        user,
        ip,
        existing.provider_id,
      ];

      const res = await client.query(sql, params);
      await this.activityLog.log({
        message: 'Network provider details updated successfully',
        module: 'NETWORK',
        action: 'UPDATE',
        referenceId: id,
        performedBy: user,
        ipAddress: ip,
      }, client);
      return res.rows[0];
    });
  }

  async softDelete(id: string, user: string, ip: string) {
   return this.db.transaction(async (client) => {
      if (!/^N\d+$/.test(id)) {
        throw new NotFoundException('Invalid provider ID format');
      }
      const existingRes = await client.query(
        `SELECT * FROM m_wifi_provider WHERE provider_id = $1 AND is_active = true FOR UPDATE`,
        [id],
      );
      if (!existingRes.rowCount) {
        throw new BadRequestException(`Provider '${id}' not found`);
      }

      const assigned = await client.query(
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
          `Cannot delete network provider '${existingRes.rows[0].provider_name}' because it is currently assigned to a guest`
        );
      }

      const sql = `
        UPDATE m_wifi_provider SET
          is_active = FALSE,
          updated_at = NOW(),
          updated_by = $1,
          updated_ip = $2
        WHERE provider_id = $3
        RETURNING *;
      `;

      const res = await client.query(sql, [
        user,
        ip,
        id,
      ]);
      await this.activityLog.log({
        message: 'New Network provider deleted successfully',
        module: 'NETWORK',
        action: 'DELETE',
        referenceId: id,
        performedBy: user,
        ipAddress: ip,
      }, client);
      return res.rows[0];
    });
  }
}
