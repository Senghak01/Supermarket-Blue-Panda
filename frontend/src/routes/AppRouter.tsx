import { Route, Routes } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Account from '@/pages/Account';
import Cart from '@/pages/Cart';
import Catalog from '@/pages/Catalog';
import Checkout from '@/pages/Checkout';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import OrderDetail from '@/pages/OrderDetail';
import Orders from '@/pages/Orders';
import ProductDetail from '@/pages/ProductDetail';
import Register from '@/pages/Register';
import StaffInventory from '@/pages/StaffInventory';
import AdminCategories from '@/pages/admin/AdminCategories';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminUsers from '@/pages/admin/AdminUsers';

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Public */}
        <Route index element={<Home />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        {/* Signed-in customers */}
        <Route element={<ProtectedRoute />}>
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="account" element={<Account />} />
        </Route>

        {/* Staff (and admins) */}
        <Route element={<ProtectedRoute requiredRole={['Staff', 'Admin']} />}>
          <Route path="staff/inventory" element={<StaffInventory />} />
        </Route>

        {/* Admins only */}
        <Route element={<ProtectedRoute requiredRole="Admin" />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route path="orders" element={<AdminOrders />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
