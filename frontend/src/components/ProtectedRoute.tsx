import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  requiredRole?: string | string[];
  requiredPerm?: string;
}

export default function ProtectedRoute({ requiredRole, requiredPerm }: Props) {
  const { isAuthenticated, isAdmin, user, hasPermission } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;

  if (requiredRole) {
    const wanted = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    // Admins can open everything; others need one of the listed roles
    if (!isAdmin && !wanted.some((r) => user?.roles.includes(r))) return <Navigate to="/" replace />;
  }

  if (requiredPerm && !hasPermission(requiredPerm)) return <Navigate to="/" replace />;

  return <Outlet />;
}
