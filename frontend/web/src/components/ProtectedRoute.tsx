import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  requiredRole?: string | string[];
  requiredPerm?: string;
}

export default function ProtectedRoute({ requiredRole, requiredPerm }: Props) {
  const { isAuthenticated, isAdmin, isStaff, user, hasPermission } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  // If logged in as customer only (no staff or admin role), deny access to employee portal
  if (!isAdmin && !isStaff) {
    return <Navigate to="/login?customer_access_denied=1" replace />;
  }

  if (requiredRole) {
    const wanted = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    // Admins can access everything; others need one of the listed roles
    if (!isAdmin && !wanted.some((r) => user?.roles.includes(r))) {
      return <Navigate to="/" replace />;
    }
  }

  if (requiredPerm && !hasPermission(requiredPerm)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
