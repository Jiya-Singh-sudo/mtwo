import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '@/api/apiClient';
import { loginApi, logoutApi } from '@/api/authentication/auth.api';

type UserPayload = {
  sub: string;          // user_id
  username: string;
  role: string;     // optional stable identifier
  permissions: string[];
};

type AuthContextType = {
  user: UserPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, recaptchaToken: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const secureStoreAvailable = async () => {
    try {
      return await SecureStore.isAvailableAsync();
    } catch {
      return false;
    }
  };

  const getStoredValue = async (key: string) => {
    if (!(await secureStoreAvailable())) return null;

    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  };

  const setStoredValue = async (key: string, value: string) => {
    if (!(await secureStoreAvailable())) return;

    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // ignore storage failures
    }
  };

  const deleteStoredValue = async (key: string) => {
    if (!(await secureStoreAvailable())) return;

    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // ignore storage failures
    }
  };

  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = await getStoredValue('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Failed to load stored auth', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredUser();
  }, []);

  // const login = async (username: string, password: string, recaptchaToken: string) => {
  //   const res = await api.post('/auth/login', {
  //     username,
  //     password,
  //     recaptchaToken,
  //   });

  //   const { accessToken, payload } = res.data;

  //   await AsyncStorage.setItem('accessToken', accessToken);
  //   await AsyncStorage.setItem('user', JSON.stringify(payload));

  //   setUser(payload);
  // };
  const login = async (
    username: string,
    password: string,
    // recaptchaToken: string
  ) => {
    const res = await loginApi(username, password);

    const { accessToken, refreshToken, payload } = res;

    await setStoredValue('accessToken', accessToken);
    await setStoredValue('refreshToken', refreshToken);
    await setStoredValue('user', JSON.stringify(payload));

    setUser(payload);
  }

  const logout = async () => {
    const refreshToken = await getStoredValue('refreshToken');

    if (refreshToken) {
      try {
        await logoutApi(refreshToken);
      } catch (e) {
        console.warn('Logout API failed');
      }
    }

    await deleteStoredValue('accessToken');
    await deleteStoredValue('refreshToken');
    await deleteStoredValue('user');

    setUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) ?? false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
};