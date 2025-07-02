import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, AuthUser } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user, isAuthenticated, isAdmin, isLoading, logout, refetch } = useAuth();

  const login = () => {
    window.location.href = '/auth/discord';
  };

  const handleLogout = async () => {
    await logout();
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out',
    });
  };

  // Convert the user to the expected type (AuthUser | null)
  const safeUser: AuthUser | null = user === undefined ? null : user;

  return (
    <AuthContext.Provider
      value={{
        user: safeUser,
        isAuthenticated,
        isAdmin,
        isLoading,
        login,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}