import { BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export class UsersValidator {

  normalizeUsername(username: string): string {
    return username.trim().toLowerCase();
  }

  validatePasswordStrength(password: string) {
    const strong =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password);

    if (!strong) {
      throw new BadRequestException(
        'Password must be at least 8 characters and include uppercase, lowercase and number'
      );
    }
  }

  async ensureUsernameUnique(username: string, client: any) {
    const res = await client.query(
      `SELECT 1 FROM m_user WHERE username = $1`,
      [username],
    );

    if (res.rowCount > 0) {
      throw new BadRequestException('Username already exists');
    }
  }

  async ensureEmailUnique(email: string, client: any) {
    if (!email) return;

    const res = await client.query(
      `SELECT 1 FROM m_staff WHERE email = $1`,
      [email],
    );

    if (res.rowCount > 0) {
      throw new BadRequestException('Email already exists');
    }
  }

  async validateRole(role_id: string, client: any) {
    const res = await client.query(
      `SELECT 1 FROM m_role WHERE role_id = $1 AND is_active = true`,
      [role_id],
    );

    if (!res.rowCount) {
      throw new BadRequestException('Invalid or inactive role');
    }
  }

  validateMobile(mobile?: number) {
    if (!mobile) return;

    const mobileStr = mobile.toString();

    if (!/^[0-9]{10}$/.test(mobileStr)) {
      throw new BadRequestException('Mobile must be 10 digits');
    }
  }

  async validateCreate(dto: CreateUserDto, client: any) {
    const username = this.normalizeUsername(dto.username);

    await this.ensureUsernameUnique(username, client);
    await this.ensureEmailUnique(dto.email, client);
    await this.validateRole(dto.role_id, client);

    this.validatePasswordStrength(dto.password);
    this.validateMobile(dto.primary_mobile);
    this.validateMobile(dto.alternate_mobile);

    return username;
  }

  async validateUpdate(
    dto: UpdateUserDto,
    existing: any,
    client: any,
  ) {
    if (dto.username && dto.username !== existing.username) {
      const username = this.normalizeUsername(dto.username);
      await this.ensureUsernameUnique(username, client);
    }

    if (dto.role_id && dto.role_id !== existing.role_id) {
      await this.validateRole(dto.role_id, client);
    }

    if (dto.password) {
      this.validatePasswordStrength(dto.password);
    }

    if (dto.primary_mobile) {
      this.validateMobile(dto.primary_mobile);
    }

    if (dto.alternate_mobile) {
      this.validateMobile(dto.alternate_mobile);
    }
  }
}