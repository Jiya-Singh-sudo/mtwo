// server/src/role-permissions/role-permissions.service.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class RolePermissionService {
  constructor(private readonly db: DatabaseService) {}

  async getPermissionsByRole(role_id: string) {
    const sql = `
      SELECT rp.permission_id, p.permission_name
      FROM t_role_permissions rp
      JOIN m_permissions p ON p.permission_id = rp.permission_id
      WHERE rp.role_id = $1
        AND rp.is_active = true
        AND p.is_active = true
    `;
    const res = await this.db.query(sql, [role_id]);
    return res.rows;
  }

  async assignPermissionToRole(
    role_id: string,
    permission_id: string,
    user: string,
    ip: string
  ) {
    const sql = `
      INSERT INTO t_role_permissions (
        role_id,
        permission_id,
        is_active,
        inserted_at,
        inserted_by,
        inserted_ip
      )
      VALUES ($1, $2, true, NOW(), $3, $4)
      ON CONFLICT (role_id, permission_id)
      DO UPDATE SET
        is_active = true,
        updated_at = NOW(),
        updated_by = $3,
        updated_ip = $4
    `;
    await this.db.query(sql, [role_id, permission_id, user, ip]);
  }

  async revokePermissionFromRole(
    role_id: string,
    permission_id: string,
    user: string,
    ip: string
  ) {
    const sql = `
      UPDATE t_role_permissions
      SET
        is_active = false,
        updated_at = NOW(),
        updated_by = $3,
        updated_ip = $4
      WHERE role_id = $1 AND permission_id = $2
    `;
    await this.db.query(sql, [role_id, permission_id, user, ip]);
  }
}
