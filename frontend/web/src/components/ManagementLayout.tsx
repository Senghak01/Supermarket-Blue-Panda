import { Avatar, Button, Layout, Menu, Popconfirm, Space, Tag, Typography, theme } from 'antd';
import {
  AppstoreOutlined,
  DashboardOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/authSlice';

const { Header, Sider, Content, Footer } = Layout;
const { Text } = Typography;

export default function ManagementLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user, isAdmin, hasPermission } = useAuth();
  const canManageStock = hasPermission('ManageStock');
  const canManageProducts = hasPermission('ManageProducts');
  const canManageCategories = hasPermission('ManageCategories');
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Build navigation items according to roles
  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/inventory',
      icon: <AppstoreOutlined />,
      label: 'Inventory & Stock',
    },
    {
      key: '/products',
      icon: <ShoppingOutlined />,
      label: 'Products Catalog',
    },
    {
      key: '/categories',
      icon: <AppstoreOutlined />,
      label: 'Store Aisles',
    },
    ...(isAdmin
      ? [
          {
            key: '/orders',
            icon: <ShoppingOutlined />,
            label: 'Orders Management',
          },
          {
            key: '/users',
            icon: <TeamOutlined />,
            label: 'Staff & Roles',
          },
        ]
      : []),
  ];

  // Determine active key from pathname
  const activeKey =
    menuItems.find((item) => item.key !== '/' && location.pathname.startsWith(item.key))?.key ?? '/';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        style={{
          background: '#0e2316',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: '0.5px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/')}
        >
          🏪 Supermarket Ops
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', marginTop: 12 }}
        />

        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 8,
            color: '#fff',
            fontSize: 12,
          }}
        >
          <div style={{ color: '#8ec5a4', fontWeight: 600, marginBottom: 4 }}>Access Level</div>
          <div>Role: <strong>{isAdmin ? 'Administrator' : 'Staff Member'}</strong></div>
          {canManageStock && (
            <div style={{ color: '#52c41a', marginTop: 4 }}>
              &bull; Stock Control Active
            </div>
          )}
          {canManageProducts && (
            <div style={{ color: '#13c2c2', marginTop: 4 }}>
              &bull; Catalog Management Active
            </div>
          )}
          {canManageCategories && (
            <div style={{ color: '#9254de', marginTop: 4 }}>
              &bull; Category Management Active
            </div>
          )}
        </div>
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e8e8e8',
            height: 64,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Text strong style={{ fontSize: 16 }}>
              {menuItems.find((i) => i.key === activeKey)?.label ?? 'Management'}
            </Text>
          </div>

          <Space size="middle">
            <Space size="small">
              <Avatar style={{ backgroundColor: isAdmin ? '#d48806' : '#1f6f43' }} icon={<UserOutlined />} />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <Text strong style={{ fontSize: 13 }}>
                  {user?.username}
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {user?.email}
                </Text>
              </div>
            </Space>

            <Space size={4}>
              {isAdmin ? (
                <Tag color="gold" style={{ margin: 0, fontWeight: 600 }}>
                  ADMIN
                </Tag>
              ) : (
                <Tag color="blue" style={{ margin: 0, fontWeight: 600 }}>
                  STAFF
                </Tag>
              )}

              {canManageStock && !isAdmin && (
                <Tag color="green" icon={<SafetyCertificateOutlined />} style={{ margin: 0 }}>
                  Stock Adjust
                </Tag>
              )}

              {canManageProducts && !isAdmin && (
                <Tag color="cyan" icon={<ShoppingOutlined />} style={{ margin: 0 }}>
                  Catalog
                </Tag>
              )}

              {canManageCategories && !isAdmin && (
                <Tag color="purple" icon={<AppstoreOutlined />} style={{ margin: 0 }}>
                  Categories
                </Tag>
              )}
            </Space>

            <Popconfirm
              title="Log out"
              description="Are you sure you want to sign out of the employee portal?"
              onConfirm={handleLogout}
              okText="Yes, Log out"
              cancelText="Cancel"
            >
              <Button type="text" icon={<LogoutOutlined />} danger>
                Log out
              </Button>
            </Popconfirm>
          </Space>
        </Header>

        <Content style={{ margin: '24px 24px 0' }}>
          <div
            style={{
              padding: 24,
              minHeight: 'calc(100vh - 170px)',
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>

        <Footer style={{ textAlign: 'center', color: '#8c8c8c', fontSize: 12, padding: '12px 24px' }}>
          Supermarket Operations &amp; Inventory Management System &bull; Internal Employee Portal
        </Footer>
      </Layout>
    </Layout>
  );
}
