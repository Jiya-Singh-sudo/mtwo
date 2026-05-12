import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '@/api/apiClient';
import { jwtDecode } from "jwt-decode";

type UserPayload = {
  sub: string;              // user_id
  username: string;
  role_id?: string;         // optional, stable identifier
  permissions: string[];
};

type AuthContextType = {
  user: UserPayload | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean; // ✅ ADD
  login: (username: string, password: string, recaptchaToken: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (username: string, password: string, recaptchaToken: string) => {
    const res = await api.post('/auth/login', { username, password, recaptchaToken });

    const { accessToken, refreshToken, payload } = res.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(payload));

    setUser(payload);
    scheduleTokenRefresh(accessToken);
  };

  const logout = async () => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }

    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (err) {
      console.warn('Logout API failed:', err);
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) ?? false;
  };
  // useEffect(() => {
  //   const initAuth = async () => {
  //     try {
  //       const res = await api.post("/auth/refresh");
  //       // const res = await api.post("/auth/refresh", {
  //       //   refreshToken,
  //       // });
  //       localStorage.setItem("accessToken", res.data.accessToken);
  //       scheduleTokenRefresh(res.data.accessToken);
  //     } catch {
  //       // logout();
  //       // console.warn("Refresh failed");
  //       console.log("No existing session");
  //     }
  //   };

  //   initAuth();
  // }, []);
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get refresh token from localStorage (store it there on login)
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const res = await api.post("/auth/refresh", { refreshToken });

        localStorage.setItem("accessToken", res.data.accessToken);

        // optionally fetch user again if needed
        const userRes = await api.get("/auth/me");
        localStorage.setItem("user", JSON.stringify(userRes.data));
        setUser(userRes.data);

      } catch (err) {
        console.log("No existing session");
      } finally {
        setIsAuthLoading(false);
      }
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAuthLoading,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
let refreshTimer: any = null;

function scheduleTokenRefresh(token: string) {
  try {
    const decoded: any = jwtDecode(token);

    if (!decoded.exp) return;

    const expiryTime = decoded.exp * 1000;
    const currentTime = Date.now();

    // refresh 1 minute before expiry
    const refreshTime = expiryTime - currentTime - 60 * 1000;

    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }

    if (refreshTime > 0) {
      refreshTimer = setTimeout(async () => {
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            throw new Error('No refresh token for auto refresh');
          }

          const res = await api.post("/auth/refresh", { refreshToken });
          const newAccessToken = res.data.accessToken;
          const newRefreshToken = res.data.refreshToken;

          localStorage.setItem("accessToken", newAccessToken);
          localStorage.setItem("refreshToken", newRefreshToken);

          scheduleTokenRefresh(newAccessToken); // 🔁 reschedule
        } catch (err) {
          console.log("Auto refresh failed");
        }
      }, refreshTime);
    }
  } catch (err) {
    console.log("Invalid token");
  }
}
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
};
