import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';

export type AuthUser = {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  isAdmin: boolean | null;
};

export function useAuth() {
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery<AuthUser | null>({
    queryKey: ['/api/auth/me'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    retry: false,
  });

  const isAuthenticated = !!user;
  const isAdmin = user?.isAdmin === true;

  const logout = async () => {
    try {
      await fetch('/auth/logout');
      await refetch();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return {
    user,
    isAuthenticated,
    isAdmin,
    isLoading,
    error,
    refetch,
    logout,
  };
}