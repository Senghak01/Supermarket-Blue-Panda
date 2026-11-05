import { Route, Routes, Navigate } from 'react-router-dom';
import ManagementLayout from '@/components/ManagementLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Dashboard from '@/pages/Dashboard';
import ForgotPassword from '@/pages/ForgotPassword';
import Login from '@/pages/Login';
import StaffInventory from '@/pages/StaffInventory';
import AdminCategories from '@/pages/admin/AdminCategories';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminUsers from '@/pages/admin/AdminUsers';

export default function AppRouter() {
  return (
    <Routes>
      {/* Public Login & Password Recovery */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Employee Management Portal (Staff or Admin) */}
      <Route element={<ProtectedRoute requiredRole={['Staff', 'Admin']} />}>
        <Route element={<ManagementLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="inventory" element={<StaffInventory />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />

          {/* Admin Only Routes */}
          <Route element={<ProtectedRoute requiredRole="Admin" />}>
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
