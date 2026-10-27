import { Avatar, Badge, Button, Dropdown, Input, Layout, Menu } from 'antd';
import { LoginOutlined, LogoutOutlined, ShoppingCartOutlined, UserOutlined } from '@ant-design/icons';
import { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/authSlice';
import { fetchCart } from '@/store/cartSlice';

const { Header, Content, Footer } = Layout;

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, isAdmin, canViewInventory } = useAuth();
  const itemCount = useAppSelector((s) => s.cart.cart?.itemCount ?? 0);

  // Load the customer's server-side cart as soon as they are signed in
  useEffect(() => {
    if (isAuthenticated) void dispatch(fetchCart());
  }, [isAuthenticated, dispatch]);

  const navItems = [
    { key: '/catalog', label: 'Shop' },
    ...(isAuthenticated ? [{ key: '/orders', label: 'My orders' }] : []),
    ...(canViewInventory ? [{ key: '/staff/inventory', label: 'Inventory' }] : []),
    ...(isAdmin ? [{ key: '/admin', label: 'Admin' }] : []),
  ];
  const selected = navItems.find((i) => location.pathname.startsWith(i.key))?.key;

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Header style={{ background: '#fff', borderBottom: '1px solid var(--line)', padding: '0 16px', height: 'auto', lineHeight: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', flexWrap: 'wrap' }}>
          <Link to="/" className="display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--leaf)' }}>
            Supermarket
          </Link>
          <Input.Search
            placeholder="Search groceries"
            allowClear
            style={{ flex: '1 1 220px', maxWidth: 440 }}
            onSearch={(q) => navigate(q ? `/catalog?search=${encodeURIComponent(q)}` : '/catalog')}
          />
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={itemCount} size="small" color="#d8452e">
              <Button type="text" shape="circle" aria-label="Cart" icon={<ShoppingCartOutlined style={{ fontSize: 20 }} />} onClick={() => navigate('/cart')} />
            </Badge>
            {isAuthenticated ? (
              <Dropdown
                menu={{
                  items: [
                    { key: 'who', label: `${user?.username} (${user?.roles.join(', ')})`, disabled: true },
                    { key: 'account', label: 'Account and addresses', onClick: () => navigate('/account') },
                    { key: 'orders', label: 'My orders', onClick: () => navigate('/orders') },
                    { type: 'divider' },
                    {
                      key: 'logout',
                      label: 'Log out',
                      icon: <LogoutOutlined />,
                      onClick: () => {
                        dispatch(logout());
                        navigate('/');
                      },
                    },
                  ],
                }}
                trigger={['click']}
              >
                <Avatar style={{ background: 'var(--leaf)', cursor: 'pointer' }} icon={<UserOutlined />} aria-label="Account menu" />
              </Dropdown>
            ) : (
              <Button type="primary" icon={<LoginOutlined />} onClick={() => navigate('/login')}>
                Log in
              </Button>
            )}
          </div>
        </div>
        <Menu mode="horizontal" selectedKeys={selected ? [selected] : []} items={navItems} onClick={({ key }) => navigate(key)} style={{ maxWidth: 1200, margin: '0 auto', borderBottom: 0, lineHeight: '40px' }} />
      </Header>
      <Content>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center', background: 'transparent' }} className="muted">
        Fresh groceries, delivered. Pay with Bakong KHQR or cash on delivery.
      </Footer>
    </Layout>
  );
}
