import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi, walletApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isFinanceAdmin: boolean;
  login: (mobile: string, password: string) => Promise<void>;
  register: (name: string, mobile: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('romenu_token');
      const savedUser = localStorage.getItem('romenu_user');
      if (savedToken) setToken(savedToken);
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const refreshUser = async () => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const me = await authApi.getMe();
      const wallet = await walletApi.getWallet().catch(() => undefined);
      const fullUser = { ...me, wallet };
      setUser(fullUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('romenu_user', JSON.stringify(fullUser));
      }
    } catch {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('romenu_token');
        localStorage.removeItem('romenu_user');
      }
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (mobile: string, password: string) => {
    const data = await authApi.login({ mobile, password });
    if (typeof window !== 'undefined') {
      localStorage.setItem('romenu_token', data.token);
    }
    setToken(data.token);
    const wallet = await walletApi.getWallet().catch(() => undefined);
    const fullUser = { ...data.user, wallet };
    setUser(fullUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('romenu_user', JSON.stringify(fullUser));
    }
  };

  const register = async (name: string, mobile: string, password: string) => {
    const data = await authApi.register({ name, mobile, password });
    if (typeof window !== 'undefined') {
      localStorage.setItem('romenu_token', data.token);
    }
    setToken(data.token);
    setUser(data.user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('romenu_user', JSON.stringify(data.user));
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('romenu_token');
      localStorage.removeItem('romenu_user');
      window.location.href = '/login';
    }
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'finance_admin';
  const isFinanceAdmin = user?.role === 'finance_admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        isFinanceAdmin,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
