import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDB, User, AuditLog } from '../utils/db';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  addAuditLog: (action: string, description: string, details?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const db = await getDB();
    const users = await db.getAllFromIndex('users', 'by-username', username);
    const foundUser = users.find(u => u.password === password);

    if (foundUser) {
      setUser(foundUser);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(foundUser));

      // Add audit log
      const log: AuditLog = {
        id: `log-${Date.now()}`,
        action: 'Login',
        description: `User ${foundUser.fullName} logged in`,
        userId: foundUser.id,
        userName: foundUser.fullName,
        timestamp: new Date().toISOString(),
      };
      await db.add('auditLogs', log);

      return true;
    }
    return false;
  };

  const logout = async () => {
    if (user) {
      const db = await getDB();
      const log: AuditLog = {
        id: `log-${Date.now()}`,
        action: 'Logout',
        description: `User ${user.fullName} logged out`,
        userId: user.id,
        userName: user.fullName,
        timestamp: new Date().toISOString(),
      };
      await db.add('auditLogs', log);
    }

    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
  };

  const addAuditLog = async (action: string, description: string, details?: string) => {
    if (!user) return;

    const db = await getDB();
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      action,
      description,
      userId: user.id,
      userName: user.fullName,
      timestamp: new Date().toISOString(),
      details,
    };
    await db.add('auditLogs', log);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, addAuditLog }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
