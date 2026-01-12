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
export async function loginApi(username: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
        username,
        password,
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
