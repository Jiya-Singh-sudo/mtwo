import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) { }

  private generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async generateUserId(): Promise<string> {
    const sql = `SELECT user_id FROM m_user ORDER BY user_id DESC LIMIT 1`;
    const result = await this.db.query(sql);
    if (result.rows.length === 0) return 'U001';
    const last = result.rows[0].user_id; // e.g. 'U015'
    const num = parseInt(last.replace(/^U/, ''), 10) + 1;
    return 'U' + num.toString().padStart(3, '0');
  }

  private hashPassword(plain: string): string {
    return crypto.createHash('sha256').update(plain).digest('hex');
  }

  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `SELECT user_id, username, full_name, full_name_local_language, role_id, user_mobile, user_alternate_mobile, email, last_login, is_active, inserted_at, inserted_by, inserted_ip, updated_at, updated_by, updated_ip FROM m_user WHERE is_active = $1 ORDER BY username`
      : `SELECT user_id, username, full_name, full_name_local_language, role_id, user_mobile, user_alternate_mobile, email, last_login, is_active, inserted_at, inserted_by, inserted_ip, updated_at, updated_by, updated_ip FROM m_user ORDER BY username`;
    const res = await this.db.query(sql, activeOnly ? [true] : []);
    return res.rows;
  }

  async findOneByUsername(username: string) {
    const sql = `SELECT * FROM m_user WHERE username = $1`;
    const res = await this.db.query(sql, [username]);
    return res.rows[0];
  }

  async findOneById(user_id: string) {
    const sql = `SELECT user_id, username, full_name, full_name_local_language, role_id, user_mobile, user_alternate_mobile, email, last_login, is_active, inserted_at, inserted_by, inserted_ip, updated_at, updated_by, updated_ip FROM m_user WHERE user_id = $1`;
    const res = await this.db.query(sql, [user_id]);
    return res.rows[0];
  }
  private sha256Hex(val: string): string{
    return crypto.createHash('sha256').update(val,'utf8').digest('hex');
  }
  async create(dto: CreateUserDto, user: string, ip: string) {
    // ensure username uniqueness should be handled by DB unique constraint,
    // you may wish to check and throw custom error if desired.
    const user_id = await this.generateUserId();
    const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false }).replace(',', '');
    const hashed = this.sha256Hex(dto.password);

    // server/src/users/users.service.ts (Inside the create method)

    const sql = `
      INSERT INTO m_user (
        user_id,
        username,
        full_name,
        full_name_local_language,
        role_id,
        user_mobile,
        user_alternate_mobile,
        password,
        email,
        last_login,
        is_active,
        inserted_at,
        inserted_by,
        inserted_ip
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NULL, true, $10, $11, $12)
      RETURNING user_id, username, full_name, full_name_local_language, role_id, user_mobile, user_alternate_mobile, email, last_login, is_active, inserted_at, inserted_by, inserted_ip;
    `;

    const params = [
      user_id,                         // $1
      dto.username,                    // $2
      dto.full_name,                   // $3
      dto.full_name_local_language ?? null, // $4
      dto.role_id,                     // $5
      dto.mobile ?? null,         // $6
      dto.alternate_mobile ?? null, // $7
      hashed,                          // $8
      dto.email ?? null,               // $9
      now,                             // $10
      user,                            // $11
      ip,                              // $12
    ];

    const res = await this.db.query(sql, params);
    return res.rows[0];
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
    const sql = `
      SELECT user_id
      FROM m_user
      WHERE reset_token = $1
        AND reset_token_expires > NOW()
        AND is_active = true
    `;

    const res = await this.db.query(sql, [dto.token]);
    if (res.rows.length === 0) {
      throw new Error('Invalid or expired reset token');
    }

    const userId = res.rows[0].user_id;
    const hashed = this.hashPassword(dto.new_password);

    const updateSql = `
      UPDATE m_user SET
        password = $1,
        reset_token = NULL,
        reset_token_expires = NULL,
        updated_at = $2,
        updated_ip = $3
      WHERE user_id = $4
    `;

    await this.db.query(updateSql, [
      hashed,
      new Date().toISOString(),
      ip,
      userId,
    ]);

    return { message: 'Password reset successfully' };
  }

  async update(username: string, dto: UpdateUserDto, user: string, ip: string) {
    const existing = await this.findOneByUsername(username);
    if (!existing) throw new Error(`User '${username}' not found`);

    const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false }).replace(',', '');

    // If incoming password present, hash it; else preserve existing.password
    const passwordHash = dto.password ? this.hashPassword(dto.password) : existing.password;

    const sql = `
      UPDATE m_user SET
        username = $1,
        full_name = $2,
        full_name_local_language = $3,
        role_id = $4,
        user_mobile = $5,
        user_alternate_mobile = $6,
        password = $7,
        email = $8,
        is_active = $9,
        updated_at = $10,
        updated_by = $11,
        updated_ip = $12
      WHERE user_id = $13
      RETURNING user_id, username, full_name, full_name_local_language, role_id, user_mobile, user_alternate_mobile, email, last_login, is_active, inserted_at, inserted_by, inserted_ip, updated_at, updated_by, updated_ip;
    `;

    const params = [
      dto.username ?? existing.username,
      dto.full_name ?? existing.full_name,
      dto.full_name_local_language ?? existing.full_name_local_language,
      dto.role_id ?? existing.role_id,
      dto.user_mobile ?? existing.user_mobile,
      dto.user_alternate_mobile ?? existing.user_alternate_mobile,
      passwordHash,
      dto.email ?? existing.email,
      dto.is_active ?? existing.is_active,
      now,
      user,
      ip,
      existing.user_id,
    ];

    const res = await this.db.query(sql, params);
    return res.rows[0];
  }

  async softDelete(username: string, user: string, ip: string) {
    const existing = await this.findOneByUsername(username);
    if (!existing) throw new Error(`User '${username}' not found`);

    const now = new Date().toISOString();

    const sql = `
      UPDATE m_user SET
        is_active = false,
        updated_at = $1,
        updated_by = $2,
        updated_ip = $3
      WHERE user_id = $4
      RETURNING user_id, username, full_name, is_active, updated_at;
    `;

    const res = await this.db.query(sql, [now, user, ip, existing.user_id]);
    return res.rows[0];
  }

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
      UPDATE m_user SET last_login = $1, updated_at = $2, updated_ip = $3
      WHERE user_id = $4
      RETURNING user_id, username, full_name, full_name_local_language, role_id, user_mobile, user_alternate_mobile, email, last_login, is_active;
    `;
    const res = await this.db.query(updSql, [now, now, ip, existing.user_id]);
    // return user without password
    return res.rows[0];
  }
}
