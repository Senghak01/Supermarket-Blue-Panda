import { useAppSelector } from '@/store/hooks';

export function useAuth() {
  const { user, token, status, error } = useAppSelector((s) => s.auth);

  return {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading: status === 'loading',
    error,
    isAdmin: user?.role === 'Admin',
    isStaff: user?.role === 'Staff',
    hasPermission: (perm: string) =>
      user?.role === 'Admin' || (user?.permissions?.includes(perm) ?? false),
  };
}

