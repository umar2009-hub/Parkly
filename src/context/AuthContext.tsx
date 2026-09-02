import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '../types';
import { dbService } from '../services/dbAdapter';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  signup: (fullName: string, email: string, phone: string, password: string, role: UserRole) => Promise<{ success: boolean; error: string | null }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const sessionUser = await dbService.getSessionUser();
      setUser(sessionUser);
    } catch (err) {
      console.error('[AuthContext] Failed to load session user', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (email: string, password: string) => {
    const { user: loggedUser, error } = await dbService.login(email, password);
    if (loggedUser) {
      setUser(loggedUser);
      return { success: true, error: null };
    }
    return { success: false, error };
  };

  const signup = async (fullName: string, email: string, phone: string, password: string, role: UserRole) => {
    const { user: registeredUser, error } = await dbService.signup(fullName, email, phone, password, role);
    if (registeredUser) {
      setUser(registeredUser);
      return { success: true, error: null };
    }
    return { success: false, error };
  };

  const logout = async () => {
    await dbService.logout();
    setUser(null);
  };

  const refreshProfile = async () => {
    if (user) {
      const refreshed = await dbService.getSessionUser();
      if (refreshed) {
        setUser(refreshed);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshProfile }}>
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
