import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';

@Injectable()
export class DesignationService {
  constructor(private readonly db: DatabaseService) {}

  // private async generateDesignationId(): Promise<string> {
  //   const sql = `SELECT designation_id FROM m_designation ORDER BY designation_id DESC LIMIT 1`;
  //   const result = await this.db.query(sql);

  //   if (result.rows.length === 0) return 'DGN001';

  //   const last = result.rows[0].designation_id.replace('DGN', '');
  //   const next = (parseInt(last) + 1).toString().padStart(3, '0');

  //   return `DGN${next}`;
  // }
  private async generateDesignationId(client: any): Promise<string> {
    return this.db.transaction(async (client) => {

      const sql = `
        SELECT 'DGN' || LPAD(nextval('designation_id_seq')::text, 3, '0') 
        AS designation_id
      `;
      const result = await client.query(sql);
      return result.rows[0].designation_id;
    });
  }

  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `SELECT * FROM m_guest_designation WHERE is_active = $1 ORDER BY designation_name`
      : `SELECT * FROM m_guest_designation ORDER BY designation_name`;

    const result = await this.db.query(sql, activeOnly ? [true] : []);
    return result.rows;
  }

  async getActiveDesignationList() {
    const sql = `
      SELECT
        designation_id,
        designation_name
      FROM m_guest_designation
      WHERE is_active = true
      ORDER BY designation_name;
    `;

    const result = await this.db.query(sql);
    return result.rows;
  }

  async findOneByName(name: string) {
    const sql = `SELECT * FROM m_guest_designation WHERE designation_name = $1`;
    const result = await this.db.query(sql, [name]);
    return result.rows[0];
  }

  async create(dto: CreateDesignationDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      const designation_id = await this.generateDesignationId(client);

      const sql = `
        INSERT INTO m_guest_designation (
          designation_id,
          designation_name,
          designation_name_local_language,
          is_active,
          inserted_at,
          inserted_by,
          inserted_ip,
          updated_at,
          updated_by,
          updated_ip
        )
        VALUES ($1,$2,$3,true,NOW(),$4,$5,NULL,NULL,NULL)
        RETURNING *;
      `;

      const params = [
        designation_id,
        dto.designation_name,
        dto.designation_name_local_language ?? null,
        user,
        ip
      ];

      const result = await client.query(sql, params);
      return result.rows[0];
    });
  }

  async update(name: string, dto: UpdateDesignationDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {

      const existingResult = await client.query(
        `SELECT * FROM m_guest_designation WHERE designation_name = $1 FOR UPDATE`,
        [name]
      );
      const existing = existingResult.rows[0];
      if (!existing) throw new NotFoundException(`Designation '${name}' not found`);

      const sql = `
        UPDATE m_guest_designation SET
          designation_name = $1,
          designation_name_local_language = $2,
          is_active = $3,
          updated_at = NOW(),
          updated_by = $4,
          updated_ip = $5
        WHERE designation_id = $6
        RETURNING *;
      `;

      const params = [
        dto.designation_name ?? existing.designation_name,
        dto.designation_name_local_language ?? existing.designation_name_local_language,
        dto.is_active ?? existing.is_active,
        user,
        ip,
        existing.designation_id
      ];

      const result = await client.query(sql, params);
      return result.rows[0];
    });
  }

  async softDelete(name: string, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      const existingResult = await client.query(
        `SELECT * FROM m_guest_designation WHERE designation_name = $1 FOR UPDATE`,
        [name]
      );

      const existing = existingResult.rows[0];
      if (!existing) throw new NotFoundException(`Designation '${name}' not found`);

      const sql = `
        UPDATE m_guest_designation SET
          is_active = false,
          updated_at = NOW(),
          updated_by = $1,
          updated_ip = $2
        WHERE designation_id = $3
        RETURNING *;
      `;

      const params = [user, ip, existing.designation_id];

      const result = await client.query(sql, params);
      return result.rows[0];
    });
  }
}
