import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { LoginDto } from './dto/login.dto';


@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private privateKey: string;
  private publicKey: string;
  private accessExpiresIn: string;
  private refreshExpiresDays: number;
  private refreshTokenLength: number;
  private refreshPepper: string;

  constructor(private readonly db: DatabaseService) {
    // Token settings
    this.accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
    this.refreshExpiresDays = Number(process.env.JWT_REFRESH_EXPIRES_DAYS ?? 30);
    this.refreshTokenLength = Number(process.env.REFRESH_TOKEN_LENGTH ?? 64);
    this.refreshPepper = process.env.REFRESH_TOKEN_PEPPER ?? '';

    // console.log("PRIVATE KEY PATH IS:", process.env.JWT_PRIVATE_KEY_PATH);
    // console.log("PUBLIC KEY PATH IS:", process.env.JWT_PUBLIC_KEY_PATH);

    // Load keys
    const priv = process.env.JWT_PRIVATE_KEY_PATH;
    const pub = process.env.JWT_PUBLIC_KEY_PATH;

    if (priv && pub && fs.existsSync(priv) && fs.existsSync(pub)) {
      this.privateKey = fs.readFileSync(priv, 'utf8');
      this.publicKey = fs.readFileSync(pub, 'utf8');
    } else {
      this.privateKey = process.env.JWT_PRIVATE_KEY ?? '';
      this.publicKey = process.env.JWT_PUBLIC_KEY ?? '';
    }

    if (!this.privateKey || !this.publicKey) {
      this.logger.error('JWT keys missing — configure env JWT_PRIVATE_KEY_PATH & JWT_PUBLIC_KEY_PATH');
      
    }
  }

  // SHA-256 for your password CHAR(64)
  private sha256Hex(val: string): string{
    return crypto.createHash('sha256').update(val,'utf8').digest('hex');
  }

  // --------------------- JWT Methods ---------------------
  private signAccessToken(payload: any) {
    if (!this.privateKey) throw new Error('JWT private key not configured');

    // Cast privateKey to jwt.Secret so TypeScript accepts it.
    const key = this.privateKey as jwt.Secret;

    return jwt.sign(payload, key, {
      // NOTE: algorithm is inferred from key type, but we still set it explicitly
      algorithm: 'RS256',
      expiresIn: this.accessExpiresIn,
      issuer: 'MTWO',
    } as jwt.SignOptions);
  }

  verifyAccessToken(token: string) {
    try {
      const key = this.publicKey as jwt.Secret;
      return jwt.verify(token, key, { algorithms: ['RS256'] } as jwt.VerifyOptions) as any;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  // --------------------- Refresh Token Utilities ---------------------
  private generateRandomToken() {
    return crypto.randomBytes(this.refreshTokenLength).toString('hex');
  }

  private hashRefreshToken(token: string) {
    const hmac = crypto.createHmac('sha256', this.refreshPepper);
    hmac.update(token);
    return hmac.digest('hex');
  }

  private async createRefreshTokenRow(userId: string, ip: string | null, familyId?: string) {
    const plain = this.generateRandomToken();
    const tokenHash = this.hashRefreshToken(plain);
    const family = familyId ?? uuidv4();
    const expiresAt = new Date(Date.now() + this.refreshExpiresDays * 86400 * 1000);

    const sql = `
      INSERT INTO auth_refresh_tokens (id, user_id, token_hash, family_id, expires_at, created_ip)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
      RETURNING id, expires_at, family_id
    `;
    const result = await this.db.query(sql, [userId, tokenHash, family, expiresAt, ip]);
    const row = result.rows[0];

    return { id: row.id, token: plain, expiresAt: row.expires_at, familyId: row.family_id };
  }

  private async findRefreshTokenByHash(hash: string) {
    const sql = `SELECT * FROM auth_refresh_tokens WHERE token_hash = $1 LIMIT 1`;
    const result = await this.db.query(sql, [hash]);
    return result.rows.length ? result.rows[0] : null;
  }

  private async revokeFamily(familyId: string) {
    if (!familyId) return;
    await this.db.query(
      `UPDATE auth_refresh_tokens SET is_revoked = TRUE WHERE family_id = $1`,
      [familyId],
    );
  }

  // --------------------- Role + Permissions ---------------------
  private async loadRole(roleId: string) {
    const sql = `SELECT role_id, role_name FROM m_roles WHERE role_id = $1 LIMIT 1`;
    const result = await this.db.query(sql, [roleId]);
    return result.rows.length ? result.rows[0] : null;
  }

  private async loadPermissions(roleId: string) {
    const sql = `
      SELECT p.permission_name
      FROM t_role_permissions rp
      JOIN m_permissions p ON p.permission_id = rp.permission_id
      WHERE rp.role_id = $1 AND p.is_active = TRUE AND rp.is_active = TRUE
    `;
    const result = await this.db.query(sql, [roleId]);
    return result.rows.map((r) => r.permission_name);
  }

  // --------------------- LOGIN ---------------------
  async login(dto: LoginDto, ip: string) {
    const hashedPassword = this.sha256Hex(dto.password);

    const result = await this.db.query(
      `SELECT * FROM m_user WHERE username = $1 AND is_active = true`,
      [dto.username]
    );

    if (!result.rows.length) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = result.rows[0];

    if (user.password !== hashedPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // ✅ Update last login
    await this.db.query(
      `UPDATE m_user
      SET last_login = NOW(),
          updated_ip = $1
      WHERE user_id = $2`,
      [ip, user.user_id]
    );

    // ✅ Load role
    const role = await this.loadRole(user.role_id);

    // ✅ Load permissions
    const permissions = await this.loadPermissions(user.role_id);
    console.log(typeof dto.password, dto.password);


    // ✅ JWT payload
    const payload = {
      sub: user.user_id,
      username: user.username,
      role: role?.role_name ?? user.role_id,
      permissions,
    };

    // ✅ Access token
    const accessToken = this.signAccessToken(payload);

    // ✅ Refresh token
    const refresh = await this.createRefreshTokenRow(
      user.user_id,
      ip,
    );

    // ✅ Final response (frontend expects THIS shape)
    return {
      accessToken,
      refreshToken: refresh.token,
      refreshExpiresAt: refresh.expiresAt,
      payload,
    };
  }


  // --------------------- REFRESH TOKEN ---------------------
  async refresh(receivedToken: string, ip: string | null) {
    if (!receivedToken) throw new UnauthorizedException('No refresh token');

    const tokenHash = this.hashRefreshToken(receivedToken);
    const row = await this.findRefreshTokenByHash(tokenHash);

    if (!row) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (row.is_revoked) {
      await this.revokeFamily(row.family_id);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (new Date(row.expires_at) < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Rotate
    const newRt = await this.createRefreshTokenRow(row.user_id, ip, row.family_id);

    await this.db.query(
      `UPDATE auth_refresh_tokens SET is_revoked = TRUE, replaced_by = $1, last_used_at = now() WHERE id = $2`,
      [newRt.id, row.id],
    );

    // Load user and role
    const userResult = await this.db.query(
      `SELECT * FROM m_user WHERE user_id = $1 LIMIT 1`,
      [row.user_id],
    );

    if (userResult.rows.length === 0) {
      await this.revokeFamily(row.family_id);
      throw new UnauthorizedException('User not found');
    }

    const user = userResult.rows[0];
    const role = await this.loadRole(user.role_id);
    const permissions = await this.loadPermissions(user.role_id);

    const payload = {
      sub: user.user_id,
      username: user.username,
      role: role?.role_name ?? null,
      permissions,
    };

    const accessToken = this.signAccessToken(payload);

    return {
      accessToken,
      refreshToken: newRt.token,
      refreshExpiresAt: newRt.expiresAt,
      payload,
    };
  }

  // --------------------- LOGOUT ---------------------
  async logout(receivedToken: string) {
    if (!receivedToken) return;

    const tokenHash = this.hashRefreshToken(receivedToken);
    const row = await this.findRefreshTokenByHash(tokenHash);

    if (!row) return;

    await this.db.query(`UPDATE auth_refresh_tokens SET is_revoked = TRUE WHERE id = $1`, [
      row.id,
    ]);
  }
}
