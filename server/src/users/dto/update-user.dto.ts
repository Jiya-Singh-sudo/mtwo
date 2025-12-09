export class UpdateUserDto {
  username?: string;
  full_name?: string;
  full_name_local_language?: string;

  role_id?: string;

  user_mobile?: string;
  user_alternate_mobile?: string;

  // if provided, will be hashed server-side
  password?: string;
  email?: string;

  is_active?: boolean;
}
