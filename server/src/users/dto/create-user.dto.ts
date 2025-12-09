export class CreateUserDto {
  username: string; // unique
  full_name: string;
  full_name_local_language?: string;

  role_id: string; // FK to m_roles

  user_mobile?: string;
  user_alternate_mobile?: string;

  password: string; // plaintext incoming; will be hashed server-side (SHA-256)
  email?: string;
}
