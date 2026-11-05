import { Alert, Button, Card, Col, Row, Space, Statistic, Tag, Typography } from 'antd';
import {
  AppstoreOutlined,
  DashboardOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  ShoppingOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminOrderApi, adminUserApi, inventoryApi, staffProductApi } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';

const { Title, Text, Paragraph } = Typography;

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, hasPermission } = useAuth();
  const canManageStock = hasPermission('ManageStock');
  const canManageProducts = hasPermission('ManageProducts');
  const canManageCategories = hasPermission('ManageCategories');

  const productsAsync = useAsync(async () => (await staffProductApi.list({ pageSize: 1 })).data, []);
  const lowStockAsync = useAsync(
    async () => (await inventoryApi.list({ lowStockOnly: true, lowStockThreshold: 10, pageSize: 1 })).data,
    [],
  );
  const ordersAsync = useAsync(
    async () => (isAdmin ? (await adminOrderApi.list({ pageSize: 1 })).data : null),
    [isAdmin],
  );
  const usersAsync = useAsync(
    async () => (isAdmin ? (await adminUserApi.list({ pageSize: 1 })).data : null),
    [isAdmin],
  );

  const totalProducts = productsAsync.data?.totalCount ?? 0;
  const lowStockCount = lowStockAsync.data?.totalCount ?? 0;
  const totalOrders = ordersAsync.data?.totalCount ?? 0;
  const totalUsers = usersAsync.data?.totalCount ?? 0;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '8px 0' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <DashboardOutlined style={{ color: '#1f6f43' }} /> Operations Dashboard
          </Title>
          <Text type="secondary">
            Welcome back, <strong>{user?.username}</strong>. Internal employee portal for supermarket inventory, catalog, and order fulfillment.
          </Text>
        </div>

        <Space wrap>
          {canManageStock && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/inventory')}>
              Adjust Stock
            </Button>
          )}
          {canManageProducts && (
            <Button icon={<ShoppingOutlined />} onClick={() => navigate('/products')}>
              Add Product
            </Button>
          )}
          {canManageCategories && (
            <Button icon={<AppstoreOutlined />} onClick={() => navigate('/categories')}>
              Add Category
            </Button>
          )}
        </Space>
      </div>

      {lowStockCount > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 20 }}
          message={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span>
                <strong>Inventory Warning:</strong> {lowStockCount} product{lowStockCount > 1 ? 's are' : ' is'} running low on stock (under 10 units).
              </span>
              <Button size="small" type="link" onClick={() => navigate('/inventory')}>
                Review Low Stock &rarr;
              </Button>
            </div>
          }
        />
      )}

      {/* KPI Statistic Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/products')} style={{ cursor: 'pointer' }}>
            <Statistic
              title="Catalog Products"
              value={totalProducts}
              loading={productsAsync.loading}
              prefix={<ShoppingOutlined style={{ color: '#1f6f43', marginRight: 8 }} />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>Active supermarket items</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            onClick={() => navigate('/inventory')}
            style={{ cursor: 'pointer', borderColor: lowStockCount > 0 ? '#faad14' : undefined }}
          >
            <Statistic
              title="Low Stock Alerts"
              value={lowStockCount}
              loading={lowStockAsync.loading}
              valueStyle={{ color: lowStockCount > 0 ? '#d8452e' : '#1f6f43' }}
              prefix={<WarningOutlined style={{ color: lowStockCount > 0 ? '#d8452e' : '#1f6f43', marginRight: 8 }} />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>Items with &lt; 10 units left</Text>
          </Card>
        </Col>

        {isAdmin ? (
          <>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable onClick={() => navigate('/orders')} style={{ cursor: 'pointer' }}>
                <Statistic
                  title="Total Orders"
                  value={totalOrders}
                  loading={ordersAsync.loading}
                  prefix={<AppstoreOutlined style={{ color: '#1890ff', marginRight: 8 }} />}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>Customer purchases</Text>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card hoverable onClick={() => navigate('/users')} style={{ cursor: 'pointer' }}>
                <Statistic
                  title="Staff & Users"
                  value={totalUsers}
                  loading={usersAsync.loading}
                  prefix={<TeamOutlined style={{ color: '#722ed1', marginRight: 8 }} />}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>Store team & accounts</Text>
              </Card>
            </Col>
          </>
        ) : (
          <Col xs={24} sm={12} lg={12}>
            <Card>
              <Statistic
                title="Stock Permission"
                value={canManageStock ? 'Authorized' : 'Read-Only'}
                valueStyle={{ color: canManageStock ? '#1f6f43' : '#8c8c8c' }}
                prefix={<SafetyCertificateOutlined style={{ marginRight: 8 }} />}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {canManageStock
                  ? 'You have permission to adjust inventory levels'
                  : 'Contact an admin to grant "ManageStock" for adjustments'}
              </Text>
            </Card>
          </Col>
        )}
      </Row>

      {/* Role and Permissions Badge Card */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Current Employee Profile" style={{ height: '100%' }}>
            <Paragraph>
              <strong>Email:</strong> {user?.email}
            </Paragraph>
            <Paragraph>
              <strong>Username:</strong> {user?.username}
            </Paragraph>
            <Paragraph>
              <strong>Assigned Roles:</strong>{' '}
              {user?.roles.map((r) => (
                <Tag key={r} color={r === 'Admin' ? 'gold' : r === 'Staff' ? 'blue' : 'default'} style={{ fontWeight: 600 }}>
                  {r.toUpperCase()}
                </Tag>
              ))}
            </Paragraph>
            <Paragraph style={{ marginBottom: 0 }}>
              <strong>Operational Permissions:</strong>{' '}
              {isAdmin ? (
                <Tag color="green">Full Administrative Access</Tag>
              ) : user?.permissions && user.permissions.length > 0 ? (
                user.permissions.map((p) => (
                  <Tag key={p} color="cyan">
                    {p}
                  </Tag>
                ))
              ) : (
                <Tag>Standard Staff (Read-Only)</Tag>
              )}
            </Paragraph>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Quick Management Navigation" style={{ height: '100%' }}>
            <Space orientation="vertical" style={{ width: '100%' }} size="middle">
              <Button block onClick={() => navigate('/inventory')} style={{ textAlign: 'left', height: 42 }}>
                📦 <strong>Inventory &amp; Stock</strong> &mdash; View current stock and movement audit trails
              </Button>
              <Button block onClick={() => navigate('/products')} style={{ textAlign: 'left', height: 42 }}>
                🏷️ <strong>Products Catalog</strong> &mdash; {canManageProducts ? 'Create, update, and manage products' : 'Browse product list and SKU details'}
              </Button>
              <Button block onClick={() => navigate('/categories')} style={{ textAlign: 'left', height: 42 }}>
                🗂️ <strong>Store Aisles &amp; Categories</strong> &mdash; {canManageCategories ? 'Create, update, and organize store aisles' : 'Category classification'}
              </Button>
              {isAdmin && (
                <>
                  <Button block onClick={() => navigate('/orders')} style={{ textAlign: 'left', height: 42 }}>
                    📑 <strong>Order Management</strong> &mdash; Change statuses (Preparing, Delivered, etc.)
                  </Button>
                  <Button block onClick={() => navigate('/users')} style={{ textAlign: 'left', height: 42 }}>
                    👥 <strong>Staff &amp; Permissions</strong> &mdash; Promote staff and manage accounts
                  </Button>
                </>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
