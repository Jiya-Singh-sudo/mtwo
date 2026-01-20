// server/src/permissions/permissions.service.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class PermissionsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `SELECT permission_id, permission_name, permission_desc
         FROM m_permissions
         WHERE is_active = true
         ORDER BY permission_name`
      : `SELECT permission_id, permission_name, permission_desc
         FROM m_permissions
         ORDER BY permission_name`;

    const res = await this.db.query(sql);
    return res.rows;
  }

  async findOne(permission_id: string) {
    const sql = `
      SELECT permission_id, permission_name, permission_desc, is_active
      FROM m_permissions
      WHERE permission_id = $1
    `;
    const res = await this.db.query(sql, [permission_id]);
    return res.rows[0];
  }
}
