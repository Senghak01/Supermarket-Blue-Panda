import { Alert, Button, Checkbox, Form, Input, Modal, Select, Switch, Table, Tag, message } from 'antd';
import { useState } from 'react';
import { adminUserApi } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import type { AdminUserListItem } from '@/types';
import { errorMessage } from '@/utils/errors';
import { dateTime } from '@/utils/format';

const ROLES = ['Customer', 'Staff', 'Admin'];
const STOCK = 'ManageStock';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string>();
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<{ username: string; email: string; password: string; role: string; manageStock: boolean }>();

  const list = useAsync(async () => (await adminUserApi.list({ search: search || undefined, role, page, pageSize: 15 })).data, [search, role, page]);

  const run = async (fn: () => Promise<unknown>, done: string) => {
    try { await fn(); message.success(done); void list.reload(); } catch (err) { message.error(errorMessage(err)); void list.reload(); }
  };

  const create = async () => {
    const v = await form.validateFields();
    setSaving(true);
    try {
      await adminUserApi.create({ username: v.username, email: v.email, password: v.password, role: v.role, permissions: v.role === 'Staff' && v.manageStock ? [STOCK] : [] });
      message.success('Account created');
      setCreating(false);
      void list.reload();
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="row-between" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Input.Search allowClear placeholder="Name or email" style={{ width: 240 }} onSearch={(v) => { setSearch(v); setPage(1); }} />
          <Select allowClear placeholder="Any role" style={{ minWidth: 140 }} value={role} onChange={(v) => { setRole(v); setPage(1); }} options={ROLES.map((r) => ({ value: r, label: r }))} />
        </div>
        <Button type="primary" onClick={() => { form.resetFields(); setCreating(true); }}>New staff account</Button>
      </div>
      {list.error && <Alert type="error" showIcon message={list.error} style={{ marginBottom: 12 }} />}
      <Table<AdminUserListItem>
        rowKey="customerId"
        loading={list.loading}
        dataSource={list.data?.items}
        scroll={{ x: 760 }}
        pagination={{ current: page, pageSize: 15, total: list.data?.totalCount ?? 0, onChange: setPage, showSizeChanger: false, hideOnSinglePage: true }}
        columns={[
          { title: 'Person', render: (_, u) => <div><strong>{u.username}</strong>{u.customerId === me?.customerId && <Tag style={{ marginLeft: 6 }}>You</Tag>}<div className="muted">{u.email}</div></div> },
          {
            title: 'Roles', width: 220,
            render: (_, u) => (
              <Select
                mode="multiple" size="small" style={{ width: '100%' }} value={u.roles} disabled={u.customerId === me?.customerId}
                options={ROLES.map((r) => ({ value: r, label: r }))}
                onChange={(roles) => run(() => adminUserApi.updateRoles(u.customerId, roles), 'Roles updated')}
              />
            ),
          },
          {
            title: 'Can change stock', width: 130, align: 'center',
            render: (_, u) => (
              <Switch
                size="small" checked={u.permissions.includes(STOCK)} disabled={!u.roles.includes('Staff')}
                onChange={(on) => run(() => (on ? adminUserApi.grant(u.customerId, STOCK) : adminUserApi.revoke(u.customerId, STOCK)), on ? 'Stock permission granted' : 'Stock permission removed')}
              />
            ),
          },
          { title: 'Joined', width: 150, render: (_, u) => dateTime(u.createdAt) },
          {
            title: 'Active', width: 90, align: 'center',
            render: (_, u) => (
              <Switch size="small" checked={u.isActive} disabled={u.customerId === me?.customerId} onChange={(on) => run(() => adminUserApi.setStatus(u.customerId, on), on ? 'Account reactivated' : 'Account deactivated')} />
            ),
          },
        ]}
      />
      <Modal title="New staff account" open={creating} onCancel={() => setCreating(false)} onOk={create} okText="Create account" confirmLoading={saving} destroyOnHidden>
        <Form form={form} layout="vertical" requiredMark={false} preserve={false} initialValues={{ role: 'Staff', manageStock: false }}>
          <Form.Item name="username" label="Name" rules={[{ required: true, min: 3, max: 50 }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Enter a valid email address' }]}><Input /></Form.Item>
          <Form.Item name="password" label="Temporary password" rules={[{ required: true, min: 6, message: 'Use at least 6 characters' }]}><Input.Password autoComplete="new-password" /></Form.Item>
          <Form.Item name="role" label="Role"><Select options={[{ value: 'Staff', label: 'Staff' }, { value: 'Admin', label: 'Admin' }]} /></Form.Item>
          <Form.Item noStyle shouldUpdate={(a, b) => a.role !== b.role}>
            {({ getFieldValue }) => getFieldValue('role') === 'Staff' && <Form.Item name="manageStock" valuePropName="checked"><Checkbox>Can change stock levels</Checkbox></Form.Item>}
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
