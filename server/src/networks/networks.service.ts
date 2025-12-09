import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateNetworkDto } from './dto/create-network.dto';
import { UpdateNetworkDto } from './dto/update-network.dto';

@Injectable()
export class NetworksService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `SELECT * FROM m_wifi_provider WHERE is_active = $1 ORDER BY provider_name`
      : `SELECT * FROM m_wifi_provider ORDER BY provider_name`;

    const res = await this.db.query(sql, activeOnly ? [true] : []);
    return res.rows;
  }

  async findOneByName(name: string) {
    const sql = `SELECT * FROM m_wifi_provider WHERE provider_name = $1`;
    const res = await this.db.query(sql, [name]);
    return res.rows[0];
  }

  async create(dto: CreateNetworkDto, user: string, ip: string) {
    const now = new Date()
      .toLocaleString('en-GB', { hour12: false, timeZone: 'Asia/Kolkata' })
      .replace(',', '');

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
      RETURNING *;
    `;

    const params = [
      dto.provider_id,
      dto.provider_name,
      dto.provider_name_local_language ?? null,
      dto.network_type,
      dto.bandwidth_mbps ?? null,
      dto.username ?? null,
      dto.password ?? null,
      dto.static_ip ?? null,
      dto.address ?? null,
      now,
      user,
      ip,
    ];

    const res = await this.db.query(sql, params);
    return res.rows[0];
  }

  async update(name: string, dto: UpdateNetworkDto, user: string, ip: string) {
    const existing = await this.findOneByName(name);
    if (!existing) throw new Error(`Provider '${name}' not found`);

    const now = new Date()
      .toLocaleString('en-GB', { hour12: false, timeZone: 'Asia/Kolkata' })
      .replace(',', '');

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
      RETURNING *;
    `;

    const params = [
      dto.provider_name ?? existing.provider_name,
      dto.provider_name_local_language ?? existing.provider_name_local_language,
      dto.network_type ?? existing.network_type,
      dto.bandwidth_mbps ?? existing.bandwidth_mbps,
      dto.username ?? existing.username,
      dto.password ?? existing.password,
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

  async softDelete(name: string, user: string, ip: string) {
    const existing = await this.findOneByName(name);
    if (!existing) throw new Error(`Provider '${name}' not found`);

    const now = new Date().toISOString();

    const sql = `
      UPDATE m_wifi_provider SET
        is_active = false,
        updated_at = $1,
        updated_by = $2,
        updated_ip = $3
      WHERE provider_id = $4
      RETURNING *;
    `;

    const res = await this.db.query(sql, [
      now, user, ip, existing.provider_id
    ]);

    return res.rows[0];
  }
}
