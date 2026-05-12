import apiClient from '@/api/apiClient';

export type UserPayload = {
    sub: string;
    username: string;
    role: string;
    permissions: string[];
};

export type LoginResponse = {
    accessToken: string;
    refreshToken: string;
    refreshExpiresAt: string;
    payload: UserPayload;
};

/**
 * Login API call
 */
// export async function loginApi(username: string, password: string): Promise<LoginResponse> {
//     const response = await apiClient.post<LoginResponse>('/auth/login', {
//         username,
//         password,
//     });
//     return response.data;
// }
export async function loginApi(
  username: string,
  password: string,
  recaptchaToken: string
): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', {
    username,
    password,
    recaptchaToken,
  });

  return response.data;
}
/**
 * Refresh token API call
 */
export async function refreshTokenApi(refreshToken: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/refresh', {
        refreshToken,
    });
    return response.data;
}

/**
 * Logout API call
 */
export async function logoutApi(refreshToken: string): Promise<void> {
    await apiClient.post('/auth/logout', { refreshToken });
}

/**
 * Forgot Password API
 */
export async function forgotPasswordApi(email: string): Promise<{ message: string }> {
  const response = await apiClient.post('/users/forgot-password', {
    email,
  });

  return response.data;
}

/**
 * Verify OTP API
 */
export async function verifyOtpApi(
  email: string,
  otp: string
): Promise<{ verified: boolean }> {
  const response = await apiClient.post('/users/verify-otp', {
    email,
    otp,
  });

  return response.data;
}

/**
 * Reset Password API
 */
export async function resetPasswordApi(
  email: string,
  newPassword: string
): Promise<{ message: string }> {
  const response = await apiClient.post('/users/reset-password', {
    email,
    newPassword,
  });

  return response.data;
}