import { Layout, Menu, Badge, Dropdown, Button, Space, theme } from 'antd';
import {
  ShoppingCartOutlined,
  UserOutlined,
  LoginOutlined,
  LogoutOutlined,
  DashboardOutlined,
  ShopOutlined,
  AppstoreOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/authSlice';

const { Header, Content, Footer } = Layout;

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, isAdmin, isStaff, hasPermission } = useAuth();
  const cartCount = useAppSelector((s) => s.cart.items.reduce((sum, i) => sum + i.quantity, 0));
  const { token: { colorBgContainer } } = theme.useToken();

  // Build nav items
  const menuItems = [
    { key: '/', label: 'Home', icon: <ShopOutlined /> },
    { key: '/catalog', label: 'Catalog', icon: <AppstoreOutlined /> },
  ];

  if (isAuthenticated) {
    menuItems.push({ key: '/orders', label: 'My Orders', icon: <HistoryOutlined /> });
  }

  if (isAdmin) {
    menuItems.push({ key: '/admin', label: 'Admin', icon: <DashboardOutlined /> });
  }

  if ((isStaff || isAdmin) && hasPermission('ManageStock')) {
    menuItems.push({ key: '/staff/inventory', label: 'Inventory', icon: <AppstoreOutlined /> });
  }

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const userMenu = {
    items: [
      { key: 'profile', label: `${user?.name} (${user?.role})`, disabled: true },
      { key: 'orders', label: 'My Orders', onClick: () => navigate('/orders') },
      { type: 'divider' as const },
      { key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: handleLogout },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <div
          style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginRight: 40, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          🛒 Supermarket
        </div>

        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1, minWidth: 0 }}
        />

        <Space size="middle">
          <Badge count={cartCount} size="small">
            <Button
              type="text"
              icon={<ShoppingCartOutlined style={{ fontSize: 20, color: '#fff' }} />}
              onClick={() => navigate('/cart')}
            />
          </Badge>

          {isAuthenticated ? (
            <Dropdown menu={userMenu} placement="bottomRight">
              <Button type="text" icon={<UserOutlined style={{ color: '#fff' }} />} />
            </Dropdown>
          ) : (
            <Button type="primary" icon={<LoginOutlined />} onClick={() => navigate('/login')}>
              Login
            </Button>
          )}
        </Space>
      </Header>

      <Content style={{ padding: '24px 48px', background: colorBgContainer }}>
        <Outlet />
      </Content>

      <Footer style={{ textAlign: 'center' }}>
        Supermarket System ©{new Date().getFullYear()}
      </Footer>
    </Layout>
  );
}

