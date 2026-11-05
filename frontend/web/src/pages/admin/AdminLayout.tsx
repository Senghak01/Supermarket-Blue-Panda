import { Menu, Typography } from 'antd';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';

const items = [
  { key: '/admin/orders', label: 'Orders' },
  { key: '/admin/products', label: 'Products' },
  { key: '/admin/categories', label: 'Aisles' },
  { key: '/admin/users', label: 'People' },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  if (pathname === '/admin' || pathname === '/admin/') return <Navigate to="/admin/orders" replace />;
  return (
    <div className="page">
      <Typography.Title level={2} className="page-title">Admin</Typography.Title>
      <Menu mode="horizontal" selectedKeys={[items.find((i) => pathname.startsWith(i.key))?.key ?? '']} items={items} onClick={({ key }) => navigate(key)} style={{ marginBottom: 20 }} />
      <Outlet />
    </div>
  );
}
