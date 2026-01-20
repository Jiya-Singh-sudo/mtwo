import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Usage:
 * @Roles('RL_ADMIN')
 */
export const Roles = (...roles: string[]) =>
  SetMetadata(ROLES_KEY, roles);
