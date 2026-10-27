import { useAppSelector } from '@/store/hooks';

export function useAuth() {
  const { user, token, status, error } = useAppSelector((s) => s.auth);
  const roles = user?.roles ?? [];
  const isAdmin = roles.includes('Admin');

  return {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading: status === 'loading',
    error,
    isAdmin,
    isStaff: roles.includes('Staff'),
    // Staff and admins can open the staff screens (inventory, read-only catalog)
    canViewInventory: isAdmin || roles.includes('Staff'),
    hasRole: (role: string) => isAdmin || roles.includes(role),
    hasPermission: (perm: string) => isAdmin || (user?.permissions.includes(perm) ?? false),
  };
}
