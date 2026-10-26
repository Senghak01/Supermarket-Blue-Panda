import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  requiredRole?: string;
  requiredPerm?: string;
}

export default function ProtectedRoute({ requiredRole, requiredPerm }: Props) {
  const { isAuthenticated, user, hasPermission } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  if (requiredPerm && !hasPermission(requiredPerm)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

