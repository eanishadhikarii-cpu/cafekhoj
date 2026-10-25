import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => Promise<void>;
  isAdmin: boolean;
  isBusiness: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cafekhoj_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cafekhoj_access_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const freshUser = await api.getMe();
          setUser(freshUser);
          localStorage.setItem('cafekhoj_user', JSON.stringify(freshUser));
        } catch {
          // Token expired or invalid
          logout();
        }
      }
      setIsLoading(false);
    };
    fetchMe();
  }, [token]);

  const login = async (username: string, password: string) => {
    const res = await api.login({ username, password });
    localStorage.setItem('cafekhoj_access_token', res.access);
    localStorage.setItem('cafekhoj_refresh_token', res.refresh);
    localStorage.setItem('cafekhoj_user', JSON.stringify(res.user));
    setToken(res.access);
    setUser(res.user);
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    localStorage.setItem('cafekhoj_access_token', res.access);
    localStorage.setItem('cafekhoj_refresh_token', res.refresh);
    localStorage.setItem('cafekhoj_user', JSON.stringify(res.user));
    setToken(res.access);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('cafekhoj_access_token');
    localStorage.removeItem('cafekhoj_refresh_token');
    localStorage.removeItem('cafekhoj_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = async (updatedData: Partial<User>) => {
    const updated = await api.updateMe(updatedData);
    setUser(updated);
    localStorage.setItem('cafekhoj_user', JSON.stringify(updated));
  };

  const isAdmin = user?.role === 'admin';
  const isBusiness = user?.role === 'business' || isAdmin;

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser, isAdmin, isBusiness }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

