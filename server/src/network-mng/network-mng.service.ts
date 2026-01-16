import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { TableQueryDto } from './dto/table-query.dto';

import { CreateNetworkDto } from './dto/create-network.dto';
import { UpdateNetworkDto } from './dto/update-network.dto';
import { CreateMessengerDto } from './dto/create-messenger.dto';
import { UpdateMessengerDto } from './dto/update-messenger.dto';
import { CreateGuestNetworkDto } from './dto/create-guest-network.dto';
import { UpdateGuestNetworkDto } from './dto/update-guest-network.dto';
import { CreateGuestMessengerDto } from './dto/create-guest-messgenger.dto';
import { UpdateGuestMessengerDto } from './dto/update-guest-messenger.dto';

@Injectable()
export class NetworkMngService {
    constructor(private readonly db: DatabaseService) { }

    /* ======================================================
       SHARED HELPERS
    ====================================================== */

    private nowIST() {
        return new Date()
            .toLocaleString('en-GB', { hour12: false, timeZone: 'Asia/Kolkata' })
            .replace(',', '');
    }

    private async generateNextId(
        table: string,
        column: string,
        prefix: string
    ): Promise<string> {
        const sql = `
      SELECT ${column}
      FROM ${table}
      ORDER BY CAST(SUBSTRING(${column}, ${prefix.length + 1}) AS INT) DESC
      LIMIT 1
    `;
        const res = await this.db.query(sql);
        if (!res.rows.length) return `${prefix}001`;

        const last = res.rows[0][column].substring(prefix.length);
        return `${prefix}${(parseInt(last, 10) + 1)
            .toString()
            .padStart(3, '0')}`;
    }

    /* ======================================================
       WIFI PROVIDER (m_wifi_provider)
    ====================================================== */

    async getNetworkTable(q: TableQueryDto) {
        const offset = (q.page - 1) * q.limit;
        const where = [`is_active = true`];
        const params: any[] = [];

        if (q.search) {
            params.push(`%${q.search}%`);
            where.push(`provider_name ILIKE $${params.length}`);
        }

        const data = await this.db.query(
            `
      SELECT *
      FROM m_wifi_provider
      WHERE ${where.join(' AND ')}
      ORDER BY ${q.sortBy ?? 'provider_name'} ${q.sortOrder ?? 'asc'}
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `,
            [...params, q.limit, offset]
        );

        const count = await this.db.query(
            `
      SELECT COUNT(*)::int AS count
      FROM m_wifi_provider
      WHERE ${where.join(' AND ')}
    `,
            params
        );

        return { data: data.rows, totalCount: count.rows[0].count };
    }

    async getNetworkById(id: string) {
        return (
            await this.db.query(
                `SELECT * FROM m_wifi_provider WHERE provider_id = $1`,
                [id]
            )
        ).rows[0];
    }

    async createNetwork(dto: CreateNetworkDto, user: string, ip: string) {
        const id = await this.generateNextId(
            'm_wifi_provider',
            'provider_id',
            'N'
        );

        return (
            await this.db.query(
                `
        INSERT INTO m_wifi_provider (
          provider_id, provider_name, provider_name_local_language,
          network_type, bandwidth_mbps, username, password,
          static_ip, address, is_active,
          inserted_at, inserted_by, inserted_ip
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,true,$10,$11,$12
        ) RETURNING *
      `,
                [
                    id,
                    dto.provider_name,
                    dto.provider_name_local_language ?? null,
                    dto.network_type,
                    dto.bandwidth_mbps ?? null,
                    dto.username ?? null,
                    dto.password ?? null,
                    dto.static_ip ?? null,
                    dto.address ?? null,
                    this.nowIST(),
                    user,
                    ip,
                ]
            )
        ).rows[0];
    }

    async updateNetwork(id: string, dto: UpdateNetworkDto, user: string, ip: string) {
        return (
            await this.db.query(
                `
        UPDATE m_wifi_provider SET
          provider_name = COALESCE($1, provider_name),
          provider_name_local_language = COALESCE($2, provider_name_local_language),
          network_type = COALESCE($3, network_type),
          bandwidth_mbps = COALESCE($4, bandwidth_mbps),
          username = COALESCE($5, username),
          password = COALESCE($6, password),
          static_ip = COALESCE($7, static_ip),
          address = COALESCE($8, address),
          updated_at = $9,
          updated_by = $10,
          updated_ip = $11
        WHERE provider_id = $12
        RETURNING *
      `,
                [
                    dto.provider_name,
                    dto.provider_name_local_language,
                    dto.network_type,
                    dto.bandwidth_mbps,
                    dto.username,
                    dto.password,
                    dto.static_ip,
                    dto.address,
                    this.nowIST(),
                    user,
                    ip,
                    id,
                ]
            )
        ).rows[0];
    }

    async softDeleteNetwork(id: string, user: string, ip: string) {
        return (
            await this.db.query(
                `
        UPDATE m_wifi_provider SET
          is_active = false,
          updated_at = $1,
          updated_by = $2,
          updated_ip = $3
        WHERE provider_id = $4
        RETURNING *
      `,
                [this.nowIST(), user, ip, id]
            )
        ).rows[0];
    }

    /* ======================================================
       MESSENGER (m_messenger)
    ====================================================== */

    async getMessengerTable(q: TableQueryDto) {
        const offset = (q.page - 1) * q.limit;
        const where = [`is_active = true`];
        const params: any[] = [];

        if (q.search) {
            params.push(`%${q.search}%`);
            where.push(`messenger_name ILIKE $${params.length}`);
        }

        const data = await this.db.query(
            `
      SELECT *
      FROM m_messenger
      WHERE ${where.join(' AND ')}
      ORDER BY ${q.sortBy ?? 'messenger_name'} ${q.sortOrder ?? 'asc'}
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `,
            [...params, q.limit, offset]
        );

        const count = await this.db.query(
            `
      SELECT COUNT(*)::int AS count
      FROM m_messenger
      WHERE ${where.join(' AND ')}
    `,
            params
        );

        return { data: data.rows, totalCount: count.rows[0].count };
    }

    async getMessengerById(id: string) {
        return (
            await this.db.query(
                `SELECT * FROM m_messenger WHERE messenger_id = $1`,
                [id]
            )
        ).rows[0];
    }

    async createMessenger(dto: CreateMessengerDto, user: string, ip: string) {
        const id = await this.generateNextId('m_messenger', 'messenger_id', 'M');

        return (
            await this.db.query(
                `
        INSERT INTO m_messenger (
          messenger_id, messenger_name, primary_mobile, secondary_mobile,
          email, designation, remarks, is_active,
          inserted_at, inserted_by, inserted_ip
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,true,$8,$9,$10
        ) RETURNING *
      `,
                [
                    id,
                    dto.messenger_name,
                    dto.primary_mobile,
                    dto.secondary_mobile ?? null,
                    dto.email ?? null,
                    dto.designation ?? null,
                    dto.remarks ?? null,
                    this.nowIST(),
                    user,
                    ip,
                ]
            )
        ).rows[0];
    }

    async updateMessenger(id: string, dto: UpdateMessengerDto, user: string, ip: string) {
        return (
            await this.db.query(
                `
        UPDATE m_messenger SET
          messenger_name = COALESCE($1, messenger_name),
          primary_mobile = COALESCE($2, primary_mobile),
          secondary_mobile = COALESCE($3, secondary_mobile),
          email = COALESCE($4, email),
          designation = COALESCE($5, designation),
          remarks = COALESCE($6, remarks),
          updated_at = $7,
          updated_by = $8,
          updated_ip = $9
        WHERE messenger_id = $10
        RETURNING *
      `,
                [
                    dto.messenger_name,
                    dto.primary_mobile,
                    dto.secondary_mobile,
                    dto.email,
                    dto.designation,
                    dto.remarks,
                    this.nowIST(),
                    user,
                    ip,
                    id,
                ]
            )
        ).rows[0];
    }

    async softDeleteMessenger(id: string, user: string, ip: string) {
        return (
            await this.db.query(
                `
        UPDATE m_messenger SET
          is_active = false,
          updated_at = $1,
          updated_by = $2,
          updated_ip = $3
        WHERE messenger_id = $4
        RETURNING *
      `,
                [this.nowIST(), user, ip, id]
            )
        ).rows[0];
    }

    /* ======================================================
       GUEST ↔ NETWORK (t_guest_network)
    ====================================================== */

    async getGuestNetworkTable(q: TableQueryDto) {
        const offset = (q.page - 1) * q.limit;
        const where = [`gn.is_active = true`];
        const params: any[] = [];

        if (q.search) {
            params.push(`%${q.search}%`);
            where.push(`(g.guest_name ILIKE $${params.length} OR p.provider_name ILIKE $${params.length})`);
        }

        const data = await this.db.query(
            `
      SELECT gn.*, g.guest_name, p.provider_name
      FROM t_guest_network gn
      LEFT JOIN t_guest g ON gn.guest_id = g.guest_id
      LEFT JOIN m_wifi_provider p ON gn.provider_id = p.provider_id
      WHERE ${where.join(' AND ')}
      ORDER BY ${q.sortBy ?? 'gn.start_date'} ${q.sortOrder ?? 'desc'}
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `,
            [...params, q.limit, offset]
        );

        const count = await this.db.query(
            `
      SELECT COUNT(*)::int AS count
      FROM t_guest_network gn
      LEFT JOIN t_guest g ON gn.guest_id = g.guest_id
      LEFT JOIN m_wifi_provider p ON gn.provider_id = p.provider_id
      WHERE ${where.join(' AND ')}
    `,
            params
        );

        return { data: data.rows, totalCount: count.rows[0].count };
    }

    async getGuestNetworkById(id: string) {
        return (
            await this.db.query(
                `
        SELECT gn.*, g.guest_name, p.provider_name
        FROM t_guest_network gn
        LEFT JOIN t_guest g ON gn.guest_id = g.guest_id
        LEFT JOIN m_wifi_provider p ON gn.provider_id = p.provider_id
        WHERE gn.guest_network_id = $1
      `,
                [id]
            )
        ).rows[0];
    }

    async createGuestNetwork(dto: CreateGuestNetworkDto, user: string, ip: string) {
        const id = await this.generateNextId(
            't_guest_network',
            'guest_network_id',
            'GN'
        );

        return (
            await this.db.query(
                `
        INSERT INTO t_guest_network (
          guest_network_id, guest_id, provider_id, room_id,
          start_date, start_time, end_date, end_time,
          network_status, remarks, is_active,
          inserted_at, inserted_by, inserted_ip
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,$11,$12,$13
        ) RETURNING *
      `,
                [
                    id,
                    dto.guest_id,
                    dto.provider_id,
                    dto.room_id ?? null,
                    dto.start_date,
                    dto.start_time,
                    dto.end_date ?? null,
                    dto.end_time ?? null,
                    dto.network_status ?? 'Requested',
                    dto.remarks ?? null,
                    this.nowIST(),
                    user,
                    ip,
                ]
            )
        ).rows[0];
    }

    async updateGuestNetwork(
        id: string,
        dto: UpdateGuestNetworkDto,
        user: string,
        ip: string
    ) {
        return (
            await this.db.query(
                `
        UPDATE t_guest_network SET
          provider_id = COALESCE($1, provider_id),
          room_id = COALESCE($2, room_id),
          start_date = COALESCE($3, start_date),
          start_time = COALESCE($4, start_time),
          end_date = COALESCE($5, end_date),
          end_time = COALESCE($6, end_time),
          network_status = COALESCE($7, network_status),
          remarks = COALESCE($8, remarks),
          updated_at = $9,
          updated_by = $10,
          updated_ip = $11
        WHERE guest_network_id = $12
        RETURNING *
      `,
                [
                    dto.provider_id,
                    dto.room_id,
                    dto.start_date,
                    dto.start_time,
                    dto.end_date,
                    dto.end_time,
                    dto.network_status,
                    dto.remarks,
                    this.nowIST(),
                    user,
                    ip,
                    id,
                ]
            )
        ).rows[0];
    }

    async softDeleteGuestNetwork(id: string, user: string, ip: string) {
        return (
            await this.db.query(
                `
        UPDATE t_guest_network SET
          is_active = false,
          updated_at = $1,
          updated_by = $2,
          updated_ip = $3
        WHERE guest_network_id = $4
        RETURNING *
      `,
                [this.nowIST(), user, ip, id]
            )
        ).rows[0];
    }

    /* ======================================================
       GUEST ↔ MESSENGER (t_guest_messenger)
    ====================================================== */

    async getGuestMessengerTable(q: TableQueryDto) {
        const offset = (q.page - 1) * q.limit;
        const where = [`gm.is_active = true`];
        const params: any[] = [];

        if (q.search) {
            params.push(`%${q.search}%`);
            where.push(`(g.guest_name ILIKE $${params.length} OR m.messenger_name ILIKE $${params.length})`);
        }

        const data = await this.db.query(
            `
      SELECT gm.*, g.guest_name, m.messenger_name
      FROM t_guest_messenger gm
      LEFT JOIN t_guest g ON gm.guest_id = g.guest_id
      LEFT JOIN m_messenger m ON gm.messenger_id = m.messenger_id
      WHERE ${where.join(' AND ')}
      ORDER BY ${q.sortBy ?? 'gm.assignment_date'} ${q.sortOrder ?? 'desc'}
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `,
            [...params, q.limit, offset]
        );

        const count = await this.db.query(
            `
      SELECT COUNT(*)::int AS count
      FROM t_guest_messenger gm
      LEFT JOIN t_guest g ON gm.guest_id = g.guest_id
      LEFT JOIN m_messenger m ON gm.messenger_id = m.messenger_id
      WHERE ${where.join(' AND ')}
    `,
            params
        );

        return { data: data.rows, totalCount: count.rows[0].count };
    }

    async getGuestMessengerById(id: string) {
        return (
            await this.db.query(
                `
        SELECT gm.*, g.guest_name, m.messenger_name
        FROM t_guest_messenger gm
        LEFT JOIN t_guest g ON gm.guest_id = g.guest_id
        LEFT JOIN m_messenger m ON gm.messenger_id = m.messenger_id
        WHERE gm.guest_messenger_id = $1
      `,
                [id]
            )
        ).rows[0];
    }

    async createGuestMessenger(
        dto: CreateGuestMessengerDto,
        user: string,
        ip: string
    ) {
        const id = await this.generateNextId(
            't_guest_messenger',
            'guest_messenger_id',
            'GM'
        );

        return (
            await this.db.query(
                `
        INSERT INTO t_guest_messenger (
          guest_messenger_id, guest_id, messenger_id,
          assignment_date, remarks, is_active,
          inserted_at, inserted_by, inserted_ip
        ) VALUES (
          $1,$2,$3,$4,$5,true,$6,$7,$8
        ) RETURNING *
      `,
                [
                    id,
                    dto.guest_id,
                    dto.messenger_id,
                    dto.assignment_date,
                    dto.remarks ?? null,
                    this.nowIST(),
                    user,
                    ip,
                ]
            )
        ).rows[0];
    }

    async updateGuestMessenger(
        id: string,
        dto: UpdateGuestMessengerDto,
        user: string,
        ip: string
    ) {
        return (
            await this.db.query(
                `
        UPDATE t_guest_messenger SET
          messenger_id = COALESCE($1, messenger_id),
          assignment_date = COALESCE($2, assignment_date),
          remarks = COALESCE($3, remarks),
          updated_at = $4,
          updated_by = $5,
          updated_ip = $6
        WHERE guest_messenger_id = $7
        RETURNING *
      `,
                [
                    dto.messenger_id,
                    dto.assignment_date,
                    dto.remarks,
                    this.nowIST(),
                    user,
                    ip,
                    id,
                ]
            )
        ).rows[0];
    }

    async softDeleteGuestMessenger(id: string, user: string, ip: string) {
        return (
            await this.db.query(
                `
        UPDATE t_guest_messenger SET
          is_active = false,
          updated_at = $1,
          updated_by = $2,
          updated_ip = $3
        WHERE guest_messenger_id = $4
        RETURNING *
      `,
                [this.nowIST(), user, ip, id]
            )
        ).rows[0];
    }
}
