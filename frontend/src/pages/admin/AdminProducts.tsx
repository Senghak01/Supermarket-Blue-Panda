import { Alert, Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Table, Tag, message } from 'antd';
import { useState } from 'react';
import { adminProductApi, catalogApi, staffProductApi } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import type { CreateProductRequest, ProductListItem, UpdateProductRequest } from '@/types';
import { errorMessage } from '@/utils/errors';
import { money } from '@/utils/format';

type FormValues = CreateProductRequest;

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ProductListItem | 'new' | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const cats = useAsync(async () => (await catalogApi.categories()).data, []);
  const list = useAsync(async () => (await staffProductApi.list({ search: search || undefined, page, pageSize: 15 })).data, [search, page]);

  const openEdit = async (p: ProductListItem | 'new') => {
    form.resetFields();
    setEditing(p);
    if (p === 'new') return form.setFieldsValue({ unit: 'pcs', initialStock: 0 });
    try {
      const d = (await staffProductApi.get(p.productId)).data;
      form.setFieldsValue({ categoryId: d.categoryId, name: d.name, description: d.description, sku: d.sku, price: d.price, unit: d.unit, imageUrl: d.imageUrl, });
    } catch (err) {
      message.error(errorMessage(err));
    }
  };

  const save = async () => {
    const v = await form.validateFields();
    setSaving(true);
    try {
      if (editing === 'new') {
        await adminProductApi.create(v);
      } else if (editing) {
        const body: UpdateProductRequest = {
          categoryId: v.categoryId, name: v.name, description: v.description, sku: v.sku,
          price: v.price, unit: v.unit, imageUrl: v.imageUrl, isActive: true,
        };
        await adminProductApi.update(editing.productId, body);
      }
      message.success(editing === 'new' ? 'Product created' : 'Product saved');
      setEditing(null);
      void list.reload();
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    try { await adminProductApi.remove(id); message.success('Product removed from the shop'); void list.reload(); } catch (err) { message.error(errorMessage(err)); }
  };

  return (
    <>
      <div className="row-between" style={{ marginBottom: 16 }}>
        <Input.Search allowClear placeholder="Search name or SKU" style={{ width: 260 }} onSearch={(v) => { setSearch(v); setPage(1); }} />
        <Button type="primary" onClick={() => openEdit('new')}>New product</Button>
      </div>
      {list.error && <Alert type="error" showIcon message={list.error} style={{ marginBottom: 12 }} />}
      <Table
        rowKey="productId"
        loading={list.loading}
        dataSource={list.data?.items}
        scroll={{ x: 560 }}
        pagination={{ current: page, pageSize: 15, total: list.data?.totalCount ?? 0, onChange: setPage, showSizeChanger: false, hideOnSinglePage: true }}
        columns={[
          { title: 'Product', render: (_, p) => <div><strong>{p.name}</strong><div className="muted">{p.sku} · {p.categoryName}</div></div> },
          { title: 'Price', align: 'right', width: 130, render: (_, p) => <span className="price">{money(p.price)} / {p.unit}</span> },
          { title: 'Stock', width: 100, render: (_, p) => (p.inStock ? <Tag color="green">In stock</Tag> : <Tag color="red">Sold out</Tag>) },
          {
            title: '', width: 150,
            render: (_, p) => (
              <span style={{ display: 'flex', gap: 4 }}>
                <Button size="small" onClick={() => openEdit(p)}>Edit</Button>
                <Popconfirm title="Remove this product from the shop?" description="Customers will no longer see it." okText="Remove" okButtonProps={{ danger: true }} onConfirm={() => remove(p.productId)}>
                  <Button size="small" danger>Remove</Button>
                </Popconfirm>
              </span>
            ),
          },
        ]}
      />
      <Modal title={editing === 'new' ? 'New product' : 'Edit product'} open={editing !== null} onCancel={() => setEditing(null)} onOk={save} okText="Save product" confirmLoading={saving} destroyOnHidden width={560}>
        <Form form={form} layout="vertical" requiredMark={false} preserve={false}>
          <Form.Item name="name" label="Name" rules={[{ required: true, min: 2, max: 150 }]}><Input /></Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="sku" label="SKU" rules={[{ required: true, max: 50 }]}><Input /></Form.Item>
            <Form.Item name="categoryId" label="Aisle" rules={[{ required: true, message: 'Choose an aisle' }]}>
              <Select options={cats.data?.map((c) => ({ value: c.categoryId, label: c.name }))} />
            </Form.Item>
            <Form.Item name="price" label="Price (USD)" rules={[{ required: true, type: 'number', min: 0.01, message: 'Enter a price above 0' }]}><InputNumber min={0.01} step={0.05} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="unit" label="Unit" rules={[{ required: true, max: 20 }]}><Input placeholder="kg, pcs, bottle…" /></Form.Item>
          </div>
          {editing === 'new' && <Form.Item name="initialStock" label="Starting stock" rules={[{ type: 'number', min: 0 }]}><InputNumber min={0} precision={0} style={{ width: 160 }} /></Form.Item>}
          <Form.Item name="imageUrl" label="Image link"><Input placeholder="https://…" /></Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
