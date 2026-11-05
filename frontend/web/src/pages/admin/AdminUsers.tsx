import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  IdcardOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { adminUserApi } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import type { AdminUserListItem } from '@/types';
import { errorMessage } from '@/utils/errors';
import { dateTime } from '@/utils/format';

const { Text, Paragraph } = Typography;

const DEFAULT_ROLES = ['Admin', 'Staff'];
const SYSTEM_PERMISSIONS = [
  {
    value: 'ManageStock',
    label: 'ManageStock (Inventory & Adjustments)',
    description: 'Authorize inventory adjustments and stock movement logging',
  },
  {
    value: 'ManageProducts',
    label: 'ManageProducts (Catalog)',
    description: 'Authorize creating, updating, and removing products in the catalog',
  },
  {
    value: 'ManageCategories',
    label: 'ManageCategories (Product Category / Aisles)',
    description: 'Authorize creating, editing, and deleting store aisles and product categories',
  },
];

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>();
  const [page, setPage] = useState(1);

  // Modals state
  const [creatingUser, setCreatingUser] = useState(false);
  const [creatingRole, setCreatingRole] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserListItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Forms
  const [userForm] = Form.useForm<{
    username: string;
    email: string;
    password: string;
    roles: string[];
    permissions: string[];
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    position?: string;
    department?: string;
  }>();

  const [roleForm] = Form.useForm<{ name: string }>();

  const [editPermsForm] = Form.useForm<{
    roles: string[];
    permissions: string[];
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    position?: string;
    department?: string;
    emergencyContact?: string;
  }>();

  // Async data loaders
  const rolesAsync = useAsync(async () => {
    try {
      const res = await adminUserApi.roles();
      const list = res.data?.map((r) => r.name).filter((n) => n !== 'Customer') ?? [];
      return Array.from(new Set([...DEFAULT_ROLES, ...list]));
    } catch {
      return DEFAULT_ROLES;
    }
  }, []);

  const availableRoles = rolesAsync.data ?? DEFAULT_ROLES;

  const list = useAsync(
    async () => (await adminUserApi.list({ search: search || undefined, role: roleFilter, page, pageSize: 15 })).data,
    [search, roleFilter, page],
  );

  const run = async (fn: () => Promise<unknown>, done: string) => {
    try {
      await fn();
      message.success(done);
      void list.reload();
    } catch (err) {
      message.error(errorMessage(err));
      void list.reload();
    }
  };

  // 1. Create Staff Account
  const handleCreateUser = async () => {
    const v = await userForm.validateFields();
    setSaving(true);
    try {
      await adminUserApi.create({
        username: v.username,
        email: v.email,
        password: v.password,
        role: v.roles && v.roles.length > 0 ? v.roles[0] : 'Staff',
        permissions: v.permissions ?? [],
        firstName: v.firstName,
        lastName: v.lastName,
        phoneNumber: v.phoneNumber,
        position: v.position,
        department: v.department,
      });

      message.success(`Staff account for ${v.username} created`);
      setCreatingUser(false);
      userForm.resetFields();
      void list.reload();
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // 2. Create New Custom Role (e.g. StockController)
  const handleCreateRole = async () => {
    const v = await roleForm.validateFields();
    setSaving(true);
    try {
      await adminUserApi.createRole(v.name);
      message.success(`New role '${v.name}' created`);
      setCreatingRole(false);
      roleForm.resetFields();
      void rolesAsync.reload();
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // 3. Open Edit Roles & Permissions Modal for a user
  const openEditRolesAndPermissions = (u: AdminUserListItem) => {
    setEditingUser(u);
    editPermsForm.setFieldsValue({
      roles: u.roles,
      permissions: u.permissions,
      firstName: u.employee?.firstName ?? u.username,
      lastName: u.employee?.lastName ?? '',
      phoneNumber: u.employee?.phoneNumber ?? '',
      position: u.employee?.position ?? '',
      department: u.employee?.department ?? '',
      emergencyContact: u.employee?.emergencyContact ?? '',
    });
  };

  // 4. Save Edited Roles, Permissions & Employee Info
  const handleSaveRolesAndPermissions = async () => {
    if (!editingUser) return;
    const v = await editPermsForm.validateFields();
    setSaving(true);
    try {
      // Update roles
      if (v.roles && v.roles.length > 0) {
        await adminUserApi.updateRoles(editingUser.customerId, v.roles);
      }
      // Update permissions
      await adminUserApi.updatePermissions(editingUser.customerId, v.permissions ?? []);

      // Update employee HR profile
      await adminUserApi.updateEmployee(editingUser.customerId, {
        firstName: v.firstName?.trim() || editingUser.username,
        lastName: v.lastName?.trim() || '',
        phoneNumber: v.phoneNumber?.trim() || undefined,
        position: v.position?.trim() || undefined,
        department: v.department?.trim() || undefined,
        emergencyContact: v.emergencyContact?.trim() || undefined,
      });

      message.success(`Staff details & permissions updated for ${editingUser.username}`);
      setEditingUser(null);
      void list.reload();
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Input.Search
              allowClear
              placeholder="Search name or email"
              style={{ width: 260 }}
              onSearch={(v) => {
                setSearch(v);
                setPage(1);
              }}
            />
            <Select
              allowClear
              placeholder="Filter by role"
              style={{ minWidth: 160 }}
              value={roleFilter}
              onChange={(v) => {
                setRoleFilter(v);
                setPage(1);
              }}
              options={availableRoles.map((r) => ({ value: r, label: r }))}
            />
          </div>
        </div>

        <Space wrap>
          <Button
            icon={<SafetyCertificateOutlined />}
            onClick={() => {
              roleForm.resetFields();
              setCreatingRole(true);
            }}
          >
            + Create New Role
          </Button>

          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => {
              userForm.resetFields();
              setCreatingUser(true);
            }}
          >
            + New Staff Account
          </Button>
        </Space>
      </div>

      {/* Available Roles Chips Bar */}
      <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
        <Space wrap size={[8, 8]} align="center">
          <Text strong style={{ fontSize: 13, color: '#595959' }}>
            <TeamOutlined /> Defined System &amp; Custom Roles:
          </Text>
          {availableRoles.map((r) => (
            <Tag
              key={r}
              color={r === 'Admin' ? 'gold' : r === 'Staff' ? 'blue' : r === 'StockController' ? 'green' : 'purple'}
              style={{ fontWeight: 600 }}
            >
              {r}
            </Tag>
          ))}
        </Space>
      </Card>

      {list.error && <Alert type="error" showIcon message={list.error} style={{ marginBottom: 12 }} />}

      <Table<AdminUserListItem>
        rowKey="customerId"
        loading={list.loading}
        dataSource={list.data?.items}
        scroll={{ x: 800 }}
        pagination={{
          current: page,
          pageSize: 15,
          total: list.data?.totalCount ?? 0,
          onChange: setPage,
          showSizeChanger: false,
          hideOnSinglePage: true,
        }}
        columns={[
          {
            title: 'Employee / Staff Member',
            render: (_, u) => (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <strong style={{ fontSize: 14 }}>
                    {u.employee ? `${u.employee.firstName} ${u.employee.lastName}` : u.username}
                  </strong>
                  {u.customerId === me?.customerId && (
                    <Tag color="green" style={{ marginLeft: 2 }}>
                      You
                    </Tag>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  {u.employee?.position && (
                    <Tag color="blue" style={{ marginRight: 4, marginTop: 2 }}>
                      {u.employee.position}
                    </Tag>
                  )}
                  {u.employee?.department && (
                    <Tag color="purple" style={{ marginRight: 4, marginTop: 2 }}>
                      {u.employee.department}
                    </Tag>
                  )}
                </div>
                <div style={{ color: '#595959', fontSize: 12, marginTop: 2 }}>
                  <span>{u.email}</span>
                  {u.employee?.phoneNumber && <span style={{ marginLeft: 8 }}>📞 {u.employee.phoneNumber}</span>}
                </div>
              </div>
            ),
          },
          {
            title: 'Assigned Roles',
            render: (_, u) => (
              <Space wrap size={4}>
                {u.roles
                  .filter((r) => r !== 'Customer')
                  .map((r) => (
                    <Tag
                      key={r}
                      color={r === 'Admin' ? 'gold' : r === 'Staff' ? 'blue' : r === 'StockController' ? 'green' : 'purple'}
                    >
                      {r}
                    </Tag>
                  ))}
              </Space>
            ),
          },
          {
            title: 'Granted Permissions',
            render: (_, u) => (
              <Space wrap size={4}>
                {u.permissions.length > 0 ? (
                  u.permissions.map((p) => (
                    <Tag key={p} color="cyan" icon={<KeyOutlined />}>
                      {p}
                    </Tag>
                  ))
                ) : (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    None (Default)
                  </Text>
                )}
              </Space>
            ),
          },
          {
            title: 'Manage Access',
            width: 170,
            render: (_, u) => (
              <Button
                size="small"
                icon={<KeyOutlined />}
                disabled={u.customerId === me?.customerId}
                onClick={() => openEditRolesAndPermissions(u)}
              >
                Roles &amp; Permissions
              </Button>
            ),
          },
          {
            title: 'Active',
            width: 90,
            align: 'center',
            render: (_, u) => (
              <Switch
                size="small"
                checked={u.isActive}
                disabled={u.customerId === me?.customerId}
                onChange={(on) =>
                  run(
                    () => adminUserApi.setStatus(u.customerId, on),
                    on ? 'Account reactivated' : 'Account deactivated',
                  )
                }
              />
            ),
          },
          {
            title: 'Joined',
            width: 140,
            render: (_, u) => dateTime(u.createdAt),
          },
        ]}
      />

      {/* MODAL 1: Create New Staff Account */}
      <Modal
        title="Create New Staff Account"
        open={creatingUser}
        onCancel={() => setCreatingUser(false)}
        onOk={handleCreateUser}
        okText="Create Account"
        confirmLoading={saving}
        destroyOnHidden
        width={560}
      >
        <Form
          form={userForm}
          layout="vertical"
          requiredMark={false}
          preserve={false}
          initialValues={{ roles: ['Staff'], permissions: [] }}
        >
          <Form.Item name="username" label="Username / Identifier" rules={[{ required: true, min: 3, max: 50 }]}>
            <Input placeholder="e.g. keo_somnang" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'Enter first name' }]}>
                <Input placeholder="Somnang" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Enter last name' }]}>
                <Input placeholder="Keo" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="position" label="Job Title / Position">
                <Input placeholder="e.g. Store Associate, Cashier" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department" label="Department">
                <Input placeholder="e.g. Operations, Inventory" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="phoneNumber" label="Phone Number">
            <Input placeholder="e.g. 012 345 678" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Work Email Address"
            rules={[{ required: true, type: 'email', message: 'Enter a valid email address' }]}
          >
            <Input placeholder="employee@supermarket.com" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Temporary Password"
            rules={[{ required: true, min: 6, message: 'Minimum 6 characters' }]}
          >
            <Input.Password placeholder="••••••••" autoComplete="new-password" />
          </Form.Item>

          <Divider style={{ margin: '16px 0' }} />

          <Form.Item name="roles" label="Assign Roles (Checkboxes)" rules={[{ required: true, message: 'Select at least one role' }]}>
            <Checkbox.Group style={{ width: '100%' }}>
              <Space direction="vertical">
                {availableRoles
                  .filter((r) => r !== 'Customer')
                  .map((r) => (
                    <Checkbox key={r} value={r}>
                      <strong>{r}</strong> {r === 'StockController' ? '(Specialized Stock Controller)' : ''}
                    </Checkbox>
                  ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item name="permissions" label="Operational Permissions (Checkboxes)">
            <Checkbox.Group style={{ width: '100%' }}>
              <Space direction="vertical">
                {SYSTEM_PERMISSIONS.map((p) => (
                  <Checkbox key={p.value} value={p.value}>
                    <span>
                      <strong>{p.label}</strong> &mdash; <Text type="secondary">{p.description}</Text>
                    </span>
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL 2: Create New Custom Role (e.g. StockController) */}
      <Modal
        title="Create New System Role"
        open={creatingRole}
        onCancel={() => setCreatingRole(false)}
        onOk={handleCreateRole}
        okText="Save New Role"
        confirmLoading={saving}
        destroyOnHidden
        width={460}
      >
        <Form form={roleForm} layout="vertical" requiredMark={false} preserve={false}>
          <Paragraph>
            Create a custom employee role. The role can be assigned to store staff and checked by security policies.
          </Paragraph>
          <Form.Item
            name="name"
            label="Role Identifier"
            rules={[
              { required: true, min: 2, max: 50, message: 'Enter a valid role name' },
              {
                pattern: /^[a-zA-Z0-9_]+$/,
                message: 'Letters and numbers only (e.g. StockController, Cashier, Supervisor)',
              },
            ]}
          >
            <Input placeholder="e.g. StockController" />
          </Form.Item>

          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Suggested Roles:</Text>
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              {['StockController', 'Cashier', 'FloorManager', 'Supervisor'].map((suggested) => (
                <Button
                  key={suggested}
                  size="small"
                  onClick={() => roleForm.setFieldsValue({ name: suggested })}
                >
                  {suggested}
                </Button>
              ))}
            </div>
          </div>
        </Form>
      </Modal>

      {/* MODAL 3: Edit Staff Information, Roles & Permissions */}
      <Modal
        title={`Manage Staff & Access — ${editingUser?.employee ? `${editingUser.employee.firstName} ${editingUser.employee.lastName}` : (editingUser?.username ?? '')}`}
        open={!!editingUser}
        onCancel={() => setEditingUser(null)}
        onOk={handleSaveRolesAndPermissions}
        okText="Save Staff Changes"
        confirmLoading={saving}
        destroyOnHidden
        width={600}
      >
        <Form form={editPermsForm} layout="vertical" preserve={false}>
          <Tabs
            defaultActiveKey="roles"
            items={[
              {
                key: 'roles',
                label: (
                  <span>
                    <KeyOutlined /> Roles &amp; Permissions
                  </span>
                ),
                children: (
                  <>
                    <Alert
                      type="info"
                      showIcon
                      message="Manage roles and operational permissions for this employee account."
                      style={{ marginBottom: 16 }}
                    />

                    <Form.Item
                      name="roles"
                      label="Assigned Roles (Check all that apply)"
                      rules={[{ required: true, message: 'Assign at least one role' }]}
                    >
                      <Checkbox.Group style={{ width: '100%' }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {availableRoles.map((r) => (
                            <Card key={r} size="small" style={{ width: '100%' }}>
                              <Checkbox value={r}>
                                <Space>
                                  <Tag color={r === 'Admin' ? 'gold' : r === 'Staff' ? 'blue' : r === 'StockController' ? 'green' : 'purple'}>
                                    {r}
                                  </Tag>
                                  {r === 'StockController' && (
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      Dedicated stock control authorization
                                    </Text>
                                  )}
                                  {r === 'Admin' && (
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      Full administrative access to all operations
                                    </Text>
                                  )}
                                  {r === 'Staff' && (
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      Store staff operations member
                                    </Text>
                                  )}
                                </Space>
                              </Checkbox>
                            </Card>
                          ))}
                        </Space>
                      </Checkbox.Group>
                    </Form.Item>

                    <Form.Item name="permissions" label="Granted Permissions (Checkboxes)">
                      <Checkbox.Group style={{ width: '100%' }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {SYSTEM_PERMISSIONS.map((p) => (
                            <Card key={p.value} size="small" style={{ width: '100%' }}>
                              <Checkbox value={p.value}>
                                <div>
                                  <strong>{p.label}</strong>
                                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>{p.description}</div>
                                </div>
                              </Checkbox>
                            </Card>
                          ))}
                        </Space>
                      </Checkbox.Group>
                    </Form.Item>
                  </>
                ),
              },
              {
                key: 'profile',
                label: (
                  <span>
                    <IdcardOutlined /> Employee Profile
                  </span>
                ),
                children: (
                  <>
                    <Row gutter={12}>
                      <Col span={12}>
                        <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'Enter first name' }]}>
                          <Input placeholder="First Name" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Enter last name' }]}>
                          <Input placeholder="Last Name" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={12}>
                      <Col span={12}>
                        <Form.Item name="position" label="Position / Job Title">
                          <Input placeholder="e.g. Store Manager, Cashier" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="department" label="Department">
                          <Input placeholder="e.g. Operations, Warehouse" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={12}>
                      <Col span={12}>
                        <Form.Item name="phoneNumber" label="Phone Number">
                          <Input placeholder="e.g. 012 345 678" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="emergencyContact" label="Emergency Contact">
                          <Input placeholder="Contact name & number" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                ),
              },
            ]}
          />
        </Form>
      </Modal>
    </>
  );
}
