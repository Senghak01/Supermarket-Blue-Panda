import { Alert, Button, Card, Empty, Form, Input, Popconfirm, Skeleton, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { addressApi, authApi } from '@/api';
import AddressModal from '@/components/AddressModal';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch } from '@/store/hooks';
import { setUsername } from '@/store/authSlice';
import type { AddressResponse } from '@/types';
import { errorMessage } from '@/utils/errors';

export default function Account() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const addresses = useAsync(async () => (await addressApi.list()).data, []);
  const [editing, setEditing] = useState<AddressResponse | undefined>();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const saveName = async (v: { username: string }) => {
    setSaving(true);
    try {
      await authApi.updateProfile({ username: v.username });
      dispatch(setUsername(v.username));
      message.success('Name updated');
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const act = async (fn: () => Promise<unknown>, done: string) => {
    try { await fn(); message.success(done); void addresses.reload(); } catch (err) { message.error(errorMessage(err)); }
  };

  return (
    <div className="page-narrow" style={{ maxWidth: 820, display: 'grid', gap: 24 }}>
      <Typography.Title level={2} className="page-title" style={{ marginBottom: 0 }}>Account</Typography.Title>

      <Card title="Profile">
        <Form layout="vertical" requiredMark={false} initialValues={{ username: user?.username }} onFinish={saveName} style={{ maxWidth: 360 }}>
          <Form.Item label="Email"><Input value={user?.email} disabled /></Form.Item>
          <Form.Item name="username" label="Name" rules={[{ required: true, min: 3, max: 50, message: 'Use 3 to 50 characters' }]}><Input /></Form.Item>
          <Button type="primary" htmlType="submit" loading={saving}>Save name</Button>
        </Form>
      </Card>

      <Card title="Delivery addresses" extra={<Button type="primary" onClick={() => { setEditing(undefined); setOpen(true); }}>Add address</Button>}>
        {addresses.error && <Alert type="error" showIcon message={addresses.error} />}
        {addresses.loading ? <Skeleton active /> : addresses.data?.length ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {addresses.data.map((a) => (
              <div key={a.addressId} className="row-between" style={{ border: '1px solid var(--line)', borderRadius: 6, padding: 12, alignItems: 'flex-start' }}>
                <div>
                  <strong>{a.label}</strong> {a.isDefault && <Tag color="green">Default</Tag>}
                  <div>{a.recipientName} · {a.phoneNumber}</div>
                  <div className="muted">{[a.addressLine, a.district, a.city].filter(Boolean).join(', ')}</div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {!a.isDefault && <Button size="small" onClick={() => act(() => addressApi.setDefault(a.addressId), 'Default address changed')}>Make default</Button>}
                  <Button size="small" onClick={() => { setEditing(a); setOpen(true); }}>Edit</Button>
                  <Popconfirm title="Delete this address?" okText="Delete" okButtonProps={{ danger: true }} onConfirm={() => act(() => addressApi.remove(a.addressId), 'Address deleted')}>
                    <Button size="small" danger>Delete</Button>
                  </Popconfirm>
                </div>
              </div>
            ))}
          </div>
        ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No addresses yet. Add one to check out faster." />}
      </Card>

      <AddressModal open={open} initial={editing} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); void addresses.reload(); }} />
    </div>
  );
}
