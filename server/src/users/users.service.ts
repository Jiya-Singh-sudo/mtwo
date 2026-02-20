import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserTableQueryDto } from './dto/user-table-query.dto';
import * as crypto from 'crypto';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { transliterateToDevanagari } from '../../common/utlis/transliteration.util';

@Injectable()
export class UsersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly activityLog: ActivityLogService,
  ) { }

  private generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // private async generateUserId(): Promise<string> {
  //   const sql = `SELECT user_id FROM m_user ORDER BY user_id DESC LIMIT 1`;
  //   const result = await this.db.query(sql);
  //   if (result.rows.length === 0) return 'U001';
  //   const last = result.rows[0].user_id; // e.g. 'U015'
  //   const num = parseInt(last.replace(/^U/, ''), 10) + 1;
  //   return 'U' + num.toString().padStart(3, '0');
  // }
  private async generateUserId(client: any): Promise<string> {
    const res = await client.query(`
      SELECT 'U' || LPAD(nextval('user_seq')::text, 3, '0') AS id
    `);
    return res.rows[0].id;
  }
  private async generateStaffId(client: any): Promise<string> {
    const res = await client.query(`
      SELECT 'S' || LPAD(nextval('staff_seq')::text,3,'0') AS id
    `);
    return res.rows[0].id;
  }
  private hashPassword(plain: string): string {
    return crypto.createHash('sha256').update(plain).digest('hex');
  }

  async findAll(query: UserTableQueryDto | boolean = true) {
    // Legacy support if boolean passed (internal calls?) - although controller now passes object
    if (typeof query === 'boolean') {
      const sql = query
        ? `SELECT user_id, username, full_name, full_name_local_language, role_id, user_mobile, user_alternate_mobile, email, last_login, is_active, inserted_at, inserted_by, inserted_ip, updated_at, updated_by, updated_ip FROM m_user WHERE is_active = $1 ORDER BY username`
        : `SELECT user_id, username, full_name, full_name_local_language, role_id, user_mobile, user_alternate_mobile, email, last_login, is_active, inserted_at, inserted_by, inserted_ip, updated_at, updated_by, updated_ip FROM m_user ORDER BY username`;
      const res = await this.db.query(sql, query ? [true] : []);
      // Adapt legacy return to match new shape if needed, OR keep array if internal callers expect it.
      // But since we changed signature, let's keep array for boolean compat.
      return res.rows;
    }

    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'username',
      sortOrder = 'asc',
      status, // used for role filter or active status? Let's use it for is_active if needed, or ignore.
    } = query;

    const offset = (page - 1) * limit;

    const SORT_MAP: Record<string, string> = {
      username: 'u.username',
      full_name: 's.full_name',
      email: 's.email',
      role_id: 'u.role_id',
      is_active: 'u.is_active',
    };

    const sortColumn = SORT_MAP[sortBy] ?? 'u.username';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const where: string[] = [];

    if (!status || status === 'Active') {
      where.push('u.is_active = TRUE');
    } else if (status === 'Inactive') {
      where.push('u.is_active = FALSE');
    }
    // If status === 'All', no filter

    // Wait, User page usually shows active users. 
    // And getActiveUsers implied active users. 
    // getAllUsers (controller 'all') calls findAll(false).
    // Let's assume this endpoint is for ACTIVE users table. 

    // If we want to support showing inactive via status param:
    // if (status === 'All') where = []; else where.push('u.is_active = TRUE');
    // But original getActiveUsers was STRICTLY active.

    const sqlParams: any[] = [];
    let idx = 1;

    if (search) {
      where.push(`(
        u.username ILIKE $${idx}
        OR s.full_name ILIKE $${idx}
        OR s.email ILIKE $${idx}
        OR s.primary_mobile ILIKE $${idx}
      )`);
      sqlParams.push(`%${search}%`);
      idx++;
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    // Count
    const countSql = `
      SELECT COUNT(*)::int AS total 
      FROM m_user u 
      LEFT JOIN m_staff s ON s.staff_id = u.staff_id 
      ${whereSql}
    `;
    const countRes = await this.db.query(countSql, sqlParams);

    // Data
    const dataSql = `
      SELECT 
        u.user_id, 
        u.username, 
        s.full_name, 
        s.full_name_local_language, 
        u.role_id, 
        s.primary_mobile, 
        s.alternate_mobile, 
        s.email,
        s.address,
        u.last_login, 
        u.is_active, 
        u.inserted_at, 
        u.inserted_by, 
        u.inserted_ip, 
        u.updated_at, 
        u.updated_by, 
        u.updated_ip 
      FROM m_user u
      LEFT JOIN m_staff s ON s.staff_id = u.staff_id
      ${whereSql}
      ORDER BY ${sortColumn} ${order}
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    sqlParams.push(limit, offset);
    const dataRes = await this.db.query(dataSql, sqlParams);

    return {
      data: dataRes.rows,
      totalCount: countRes.rows[0]?.total ?? 0,
    };
  }

  async findOneByUsername(username: string) {
    const sql = `SELECT u.*, s.*
                FROM m_user u
                LEFT JOIN m_staff s ON s.staff_id = u.staff_id
                WHERE u.username = $1
                `;
    const res = await this.db.query(sql, [username]);
    return res.rows[0];
  }

  async findOneById(user_id: string) {
    // const sql = `SELECT user_id, username, full_name, full_name_local_language, role_id, user_mobile, user_alternate_mobile, email, last_login, is_active, inserted_at, inserted_by, inserted_ip, updated_at, updated_by, updated_ip FROM m_user WHERE user_id = $1`;
    const sql = `
      SELECT
        u.user_id,
        u.username,
        u.role_id,
        u.last_login,
        u.is_active,

        s.staff_id,
        s.full_name,
        s.full_name_local_language,
        s.primary_mobile,
        s.alternate_mobile,
        s.email,
        s.address,

        u.inserted_at,
        u.inserted_by,
        u.inserted_ip,
        u.updated_at,
        u.updated_by,
        u.updated_ip
      FROM m_user u
      LEFT JOIN m_staff s ON s.staff_id = u.staff_id
      WHERE u.user_id = $1
    `;
    const res = await this.db.query(sql, [user_id]);
    return res.rows[0];
  }
  // private sha256Hex(val: string): string {
  //   return crypto.createHash('sha256').update(val, 'utf8').digest('hex');
  // }
  async create(dto: CreateUserDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      // ensure username uniqueness should be handled by DB unique constraint,
      // you may wish to check and throw custom error if desired.
      const user_id = await this.generateUserId(client);
      const staff_id = await this.generateStaffId(client);
      const hashed = this.hashPassword(dto.password);

      const full_name_local_language = transliterateToDevanagari(dto.full_name);

      await client.query(`
        INSERT INTO m_staff (
          staff_id,
          full_name,
          full_name_local_language,
          primary_mobile,
          alternate_mobile,
          email,
          address,
          is_active,
          inserted_at,
          inserted_by,
          inserted_ip
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,true,NOW(),$8,$9)
      `, [
        staff_id,
        dto.full_name,
        full_name_local_language,
        dto.primary_mobile ?? null,
        dto.alternate_mobile ?? null,
        dto.email ?? null,
        dto.address ?? null,
        user,
        ip
      ]);

      // server/src/users/users.service.ts (Inside the create method)

      const sql = `
        INSERT INTO m_user (
          user_id,
          username,
          role_id,
          staff_id,
          password,
          last_login,
          is_active,
          inserted_at,
          inserted_by,
          inserted_ip
        )
        VALUES ($1,$2,$3,$4,$5,NULL,true,NOW(),$6,$7)
        RETURNING *;
      `;
      const params = [
        user_id,                         // $1
        dto.username,                    // $2
        dto.role_id,                     // $3
        staff_id,                         // $4
        hashed,                          // $5
        user,                            // $6
        ip,                              // $7
      ];

      const res = await client.query(sql, params);
      const created = res.rows[0];

      await this.activityLog.log({
        message: `User ${created.username} created`,
        module: 'USER',
        action: 'USER_CREATE',
        referenceId: created.user_id,
        performedBy: user,
        ipAddress: ip,
      }, client);

      return created;
    });
  }

  async forgotPassword(dto: ForgotPasswordDto, ip: string) {
    const user = await this.findOneByUsername(dto.username);
    if (!user) {
      // IMPORTANT: do NOT reveal user existence
      return { message: 'If the user exists, a reset link has been sent.' };
    }

    const token = this.generateResetToken();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const sql = `
      UPDATE m_user
      SET
        reset_token = $1,
        reset_token_expires = $2,
        updated_at = $3,
        updated_ip = $4
      WHERE user_id = $5
    `;

    await this.db.query(sql, [
      token,
      expires,
      new Date().toISOString(),
      ip,
      user.user_id,
    ]);

    // 🔌 Email hook (stub)
    // await this.mailService.sendResetLink(user.email, token);

    return { message: 'If the user exists, a reset link has been sent.' };
  }
  async resetPassword(dto: ResetPasswordDto, ip: string) {
    return this.db.transaction(async (client) => {
      const sql = `
        SELECT user_id
        FROM m_user
        WHERE reset_token = $1
          AND reset_token_expires > NOW()
          AND is_active = true
        FOR UPDATE
      `;

      const res = await client.query(sql, [dto.token]);
      if (res.rows.length === 0) {
        throw new BadRequestException('Invalid or expired reset token');
      }
      const userId = res.rows[0].user_id;
      const hashed = this.hashPassword(dto.new_password);

      const updateSql = `
        UPDATE m_user SET
          password = $1,
          reset_token = NULL,
          reset_token_expires = NULL,
          updated_at = NOW(),
          updated_ip = $2
        WHERE user_id = $3
      `;

      await client.query(updateSql, [
        hashed,
        ip,
        userId,
      ]);

      return { message: 'Password reset successfully' };
    });
  }

  async update(username: string, dto: UpdateUserDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {

      const existingRes = await client.query(
        `SELECT u.*, s.*
        FROM m_user u
        INNER JOIN m_staff s ON s.staff_id = u.staff_id
        WHERE u.username = $1
        FOR UPDATE`,
        [username]
      );

      if (!existingRes.rowCount) {
        throw new NotFoundException(`User '${username}' not found`);
      }
      const existing = existingRes.rows[0];
      // If incoming password present, hash it; else preserve existing.password
      const passwordHash = dto.password ? this.hashPassword(dto.password) : existing.password;
      const updatedFullName = dto.full_name ?? existing.full_name;
      const updatedLocal = dto.full_name ? transliterateToDevanagari(dto.full_name) : existing.full_name_local_language;

      await client.query(`
        UPDATE m_staff SET
          full_name = $1,
          full_name_local_language = $2,
          primary_mobile = $3,
          alternate_mobile = $4,
          email = $5,
          updated_at = NOW(),
          updated_by = $6,
          updated_ip = $7
        WHERE staff_id = $8
      `, [
        updatedFullName,
        updatedLocal,
        dto.primary_mobile ?? existing.primary_mobile,
        dto.alternate_mobile ?? existing.alternate_mobile,
        dto.email ?? existing.email,
        user,
        ip,
        existing.staff_id
      ]);

      const sql = `
        UPDATE m_user SET
          username = $1,
          role_id = $2,
          password = $3,
          is_active = $4,
          updated_at = NOW(),
          updated_by = $5,
          updated_ip = $6
        WHERE user_id = $7
        RETURNING *;
      `;

      const params = [
        dto.username ?? existing.username,
        dto.role_id ?? existing.role_id,
        passwordHash,
        dto.is_active ?? existing.is_active,
        user,
        ip,
        existing.user_id,
      ];

      const res = await client.query(sql, params);
      const updated = res.rows[0];
      console.log('UPDATE DTO:', dto);
      await this.activityLog.log({
        message: `User ${updated.username} updated`,
        module: 'USER',
        action: 'USER_UPDATE',
        referenceId: updated.user_id,
        performedBy: user,
        ipAddress: ip,
      }, client);
      return updated;
    });
  }
  async softDelete(username: string, user: string, ip: string) {
    return this.db.transaction(async (client) => {

      const existingRes = await client.query(
        `SELECT u.user_id, u.staff_id
        FROM m_user u
        INNER JOIN m_staff s ON s.staff_id = u.staff_id
        WHERE u.username = $1
        FOR UPDATE`,
        [username]
      );

      if (!existingRes.rowCount) {
        throw new NotFoundException(`User '${username}' not found`);
      }

      const { user_id, staff_id } = existingRes.rows[0];

      // 1️⃣ Deactivate user
      await client.query(
        `UPDATE m_user
        SET is_active = false,
            updated_at = NOW(),
            updated_by = $1,
            updated_ip = $2
        WHERE user_id = $3`,
        [user, ip, user_id]
      );

      // 2️⃣ Deactivate staff
      await client.query(
        `UPDATE m_staff
        SET is_active = false,
            updated_at = NOW(),
            updated_by = $1,
            updated_ip = $2
        WHERE staff_id = $3`,
        [user, ip, staff_id]
      );

      await this.activityLog.log({
        message: `User ${username} deactivated`,
        module: 'USER',
        action: 'USER_DELETE',
        referenceId: user_id,
        performedBy: user,
        ipAddress: ip,
      }, client);

      return { message: 'User deactivated successfully' };
    });
  }
  // async softDelete(username: string, user: string, ip: string) {
  //   return this.db.transaction(async (client) => {
  //     const existingRes = await client.query(
  //       `SELECT u.*, s.*
  //         FROM m_user u
  //         INNER JOIN m_staff s ON s.staff_id = u.staff_id
  //         WHERE u.username = $1
  //         FOR UPDATE`,
  //       [username]
  //     );
  //     if (!existingRes.rowCount) {
  //       throw new NotFoundException(`User '${username}' not found`);
  //     }
  //     const existing = existingRes.rows[0];
  //     const sql = `
  //       UPDATE m_user SET
  //         is_active = false,
  //         updated_at = NOW(),
  //         updated_by = $1,
  //         updated_ip = $2
  //       WHERE user_id = $3
  //       RETURNING *;
  //     `;
  //     const res = await client.query(sql, [user, ip, existing.user_id]);
  //     const deleted = res.rows[0];
  //     await this.activityLog.log({
  //       message: `User ${deleted.username} deactivated`,
  //       module: 'USER',
  //       action: 'USER_DELETE',
  //       referenceId: deleted.user_id,
  //       performedBy: user,
  //       ipAddress: ip,
  //     }, client);
  //     return deleted;
  //   });
  // }

  // Login: accepts plaintext password, hashes and compares, updates last_login on success
  async login(username: string, plainPassword: string, ip: string) {
    const existing = await this.findOneByUsername(username);
    if (!existing) return null; // keep response generic for security if you want

    const hashed = this.hashPassword(plainPassword);
    if (existing.password !== hashed) {
      return null;
    }

    // update last_login
    const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false }).replace(',', '');
    const updSql = `
      UPDATE m_user u
      SET last_login = $1,
          updated_at = $2,
          updated_ip = $3,
          updated_by = $4
      FROM m_staff s
      WHERE u.user_id = $5
        AND s.staff_id = u.staff_id
      RETURNING 
        u.user_id,
        u.username,
        u.role_id,
        u.last_login,
        u.is_active,
        s.full_name,
        s.full_name_local_language,
        s.primary_mobile AS user_mobile,
        s.alternate_mobile AS user_alternate_mobile,
        s.email,
        s.address;
    `;
    const res = await this.db.query(updSql, [now, now, ip, existing.user_id, existing.user_id]);
    // return user without password
    return res.rows[0];
  }
}
