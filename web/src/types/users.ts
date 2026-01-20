export interface User {
  user_id: string;

  username: string;
  full_name: string;
  full_name_local_language?: string | null;

  role_id: string;

  user_mobile?: number | null;
  user_alternate_mobile?: number | null;

  email?: string | null;

  last_login?: string | null;

  is_active: boolean;

  inserted_at: string;
  inserted_by?: string | null;
  inserted_ip?: string | null;

  updated_at?: string | null;
  updated_by?: string | null;
  updated_ip?: string | null;
}

// CREATE DTO (plaintext password, no ID)
export interface UserCreateDto {
  username: string;
  full_name: string;
  full_name_local_language?: string;

  role_id: string;

  user_mobile?: number;
  user_alternate_mobile?: number;

  password: string; // plaintext → backend hashes to SHA256

  email?: string;
}

// UPDATE DTO
export interface UserUpdateDto {
  username?: string;
  full_name?: string;
  full_name_local_language?: string;

  role_id?: string;

  user_mobile?: number;
  user_alternate_mobile?: number;

  password?: string; // plaintext if provided

  email?: string;

  is_active?: boolean;
}

// LOGIN DTO
export interface UserLoginDto {
  username: string;
  password: string; // plaintext → backend hashes & verifies
}
export interface ForgotPasswordRequest {
  username: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

