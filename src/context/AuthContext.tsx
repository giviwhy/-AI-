import { createContext, useContext, useState, useCallback } from 'react';
import { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (account: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchUser: (account: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = ''; // 部署到 Vercel 后使用相对路径

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      return JSON.parse(savedUser);
    }
    return null;
  });

  const isAuthenticated = user !== null;

  const login = useCallback(async (account: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ account, password }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const userData: User = {
        id: String(data.user.id),
        studentId: data.user.studentId,
        phone: data.user.phone,
        name: data.user.username,
        email: data.user.email,
        avatar: data.user.avatar,
        role: data.user.role,
        groupId: data.user.groupId,
        groupName: data.user.groupName,
        isLeader: data.user.isLeader,
      };

      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('token', data.token);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  }, []);

  const switchUser = useCallback(async (account: string, password: string): Promise<boolean> => {
    logout();
    return login(account, password);
  }, [login, logout]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, switchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}