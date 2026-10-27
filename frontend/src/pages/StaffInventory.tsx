import { Alert, Button, Form, Input, InputNumber, Modal, Select, Switch, Table, Tabs, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { catalogApi, inventoryApi } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import type { InventoryItemResponse } from '@/types';
import { errorMessage } from '@/utils/errors';
import { dateTime, movementName } from '@/utils/format';

const LOW = 10;

function Levels() {
  const { hasPermission } = useAuth();
  const canAdjust = hasPermission('ManageStock');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number>();
  const [lowOnly, setLowOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<InventoryItemResponse>();
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<{ deltaQuantity: number; note?: string }>();

  const cats = useAsync(async () => (await catalogApi.categories()).data, []);
  const list = useAsync(
    async () => (await inventoryApi.list({ search: search || undefined, categoryId, lowStockOnly: lowOnly || undefined, lowStockThreshold: LOW, page, pageSize: 15 })).data,
    [search, categoryId, lowOnly, page],
  );

  const save = async () => {
    const v = await form.validateFields();
    if (!target) return;
    setSaving(true);
    try {
      await inventoryApi.adjust({ productId: target.productId, deltaQuantity: v.deltaQuantity, note: v.note });
      message.success('Stock updated');
      setTarget(undefined);
      void list.reload();
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {!canAdjust && <Alert type="info" showIcon style={{ marginBottom: 12 }} message="You can view stock levels. Ask an admin for the stock permission to change them." />}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <Input.Search allowClear placeholder="Search name or SKU" style={{ width: 240 }} onSearch={(v) => { setSearch(v); setPage(1); }} />
        <Select allowClear placeholder="All aisles" style={{ minWidth: 180 }} value={categoryId} onChange={(v) => { setCategoryId(v); setPage(1); }} options={cats.data?.map((c) => ({ value: c.categoryId, label: c.name }))} />
        <label style={{ display: 'flex', gap: 8 }}><Switch checked={lowOnly} onChange={(v) => { setLowOnly(v); setPage(1); }} /> Low stock only (under {LOW})</label>
      </div>
      {list.error && <Alert type="error" showIcon message={list.error} style={{ marginBottom: 12 }} />}
      <Table
        rowKey="productId"
        loading={list.loading}
        dataSource={list.data?.items}
        scroll={{ x: 560 }}
        pagination={{ current: page, pageSize: 15, total: list.data?.totalCount ?? 0, onChange: setPage, showSizeChanger: false, hideOnSinglePage: true }}
        columns={[
          { title: 'Product', render: (_, i) => <div><strong>{i.productName}</strong><div className="muted">{i.sku} · {i.categoryName}</div></div> },
          { title: 'In stock', align: 'right', width: 130, render: (_, i) => <span className="price">{i.quantity} {i.unit} {i.quantity === 0 ? <Tag color="red">Out</Tag> : i.quantity < LOW ? <Tag color="orange">Low</Tag> : null}</span> },
          { title: 'Updated', width: 170, render: (_, i) => dateTime(i.updatedAt) },
          ...(canAdjust ? [{ title: '', width: 100, render: (_: unknown, i: InventoryItemResponse) => <Button size="small" onClick={() => { setTarget(i); form.resetFields(); }}>Adjust</Button> }] : []),
        ]}
      />
      <Modal title={target ? `Adjust stock: ${target.productName}` : ''} open={!!target} onCancel={() => setTarget(undefined)} onOk={save} okText="Save change" confirmLoading={saving} destroyOnHidden>
        <p className="muted">Currently {target?.quantity} {target?.unit}. Use a positive number to add stock and a negative number to remove it.</p>
        <Form form={form} layout="vertical" requiredMark={false} preserve={false}>
          <Form.Item name="deltaQuantity" label="Change" rules={[{ required: true, message: 'Enter how many to add or remove' }, { type: 'number', message: 'Enter a whole number' }, { validator: (_, v) => (v === 0 ? Promise.reject(new Error('The change cannot be zero')) : Promise.resolve()) }]}>
            <InputNumber precision={0} style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="note" label="Reason (optional)"><Input maxLength={200} placeholder="Delivery from supplier, damaged goods…" /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}

function Movements() {
  const [page, setPage] = useState(1);
  const { data, loading, error } = useAsync(async () => (await inventoryApi.movements({ page, pageSize: 20 })).data, [page]);
  const color = { Purchase: 'green', Sale: 'blue', Return: 'cyan', Adjustment: 'gold' } as const;
  return (
    <>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      <Table
        rowKey="stockMovementId"
        loading={loading}
        dataSource={data?.items}
        scroll={{ x: 560 }}
        pagination={{ current: page, pageSize: 20, total: data?.totalCount ?? 0, onChange: setPage, showSizeChanger: false, hideOnSinglePage: true }}
        columns={[
          { title: 'When', width: 170, render: (_, m) => dateTime(m.createdAt) },
          { title: 'Product', dataIndex: 'productName' },
          { title: 'Type', width: 120, render: (_, m) => { const t = movementName(m.movementType); return <Tag color={color[t]}>{t}</Tag>; } },
          { title: 'Quantity', width: 100, align: 'right', dataIndex: 'quantity' },
          { title: 'Order', width: 90, render: (_, m) => (m.referenceId ? `#${m.referenceId}` : '') },
        ]}
      />
    </>
  );
}

export default function StaffInventory() {
  return (
    <div className="page">
      <Typography.Title level={2} className="page-title">Inventory</Typography.Title>
      <Tabs items={[{ key: 'levels', label: 'Stock levels', children: <Levels /> }, { key: 'moves', label: 'Stock history', children: <Movements /> }]} />
    </div>
  );
}
