import { SetMetadata } from '@nestjs/common';
export const PERMISSIONS_KEY = "permissions";
export const Permissions = (...args: string[]) => SetMetadata('permissions', args);
  SetMetadata(PERMISSIONS_KEY, Permissions);


