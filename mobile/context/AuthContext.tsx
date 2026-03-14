import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '@/api/apiClient';
import { UserPayload } from '@/api/authentication/auth.api';

type AuthContextType = {
  user: UserPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, recaptchaToken: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error('Failed to load auth state', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadStoredAuth();
  }, []);

  const login = async (username: string, password: string, recaptchaToken: string) => {
    // Dummy login for testing
    if (username === 'sana' && password === 'Sana@123') {
      const dummyPayload: UserPayload = {
        sub: 'dummy-id',
        username: 'sana',
        role: 'ADMIN',
        permissions: ['guest.view', 'room.view', 'vehicle.view', 'transport.view', 'food.view', 'network.view', 'user.view', 'audit.view', 'report.view']
      };
      
      await AsyncStorage.setItem('accessToken', 'dummy-token');
      await AsyncStorage.setItem('refreshToken', 'dummy-refresh-token');
      await AsyncStorage.setItem('user', JSON.stringify(dummyPayload));
      
      setUser(dummyPayload);
      return;
    }

    const res = await apiClient.post('/auth/login', { username, password, recaptchaToken });
    const { accessToken, refreshToken, payload } = res.data;

    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(payload));

    setUser(payload);
  };

  const logout = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken }).catch(() => {});
      }
    } finally {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      setUser(null);
    }
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
