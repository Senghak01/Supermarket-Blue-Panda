import { Alert, Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Table, Tag, message } from 'antd';
import { useState } from 'react';
import { adminProductApi, catalogApi, staffProductApi } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import type { CreateProductRequest, ProductListItem, UpdateProductRequest } from '@/types';
import { errorMessage } from '@/utils/errors';
import { money } from '@/utils/format';

type FormValues = CreateProductRequest;

export default function AdminProducts() {
  const { isAdmin, hasPermission } = useAuth();
  const canManageProducts = isAdmin || hasPermission('ManageProducts');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ProductListItem | 'new' | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const cats = useAsync(async () => (await catalogApi.categories()).data, []);
  const list = useAsync(
    async () => (await staffProductApi.list({ search: search || undefined, page, pageSize: 15 })).data,
    [search, page],
  );

  const openEdit = async (p: ProductListItem | 'new') => {
    if (!canManageProducts) return;
    form.resetFields();
    setEditing(p);
    if (p === 'new') return form.setFieldsValue({ unit: 'pcs', initialStock: 0 });
    try {
      const d = (await staffProductApi.get(p.productId)).data;
      form.setFieldsValue({
        categoryId: d.categoryId,
        name: d.name,
        description: d.description,
        sku: d.sku,
        price: d.price,
        unit: d.unit,
        imageUrl: d.imageUrl,
      });
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
          categoryId: v.categoryId,
          name: v.name,
          description: v.description,
          sku: v.sku,
          price: v.price,
          unit: v.unit,
          imageUrl: v.imageUrl,
          isActive: true,
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
    try {
      await adminProductApi.remove(id);
      message.success('Product removed from catalog');
      void list.reload();
    } catch (err) {
      message.error(errorMessage(err));
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Input.Search
          allowClear
          placeholder="Search name or SKU"
          style={{ width: 280 }}
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
        {canManageProducts ? (
          <Button type="primary" onClick={() => openEdit('new')}>
            + New Product
          </Button>
        ) : (
          <Tag color="default">Read-Only Catalog Access (Staff)</Tag>
        )}
      </div>

      {!canManageProducts && (
        <Alert
          type="info"
          showIcon
          message="You are viewing the product catalog in read-only mode. Creating, updating, and removing products requires 'ManageProducts' permission or Administrator role."
          style={{ marginBottom: 12 }}
        />
      )}

      {list.error && <Alert type="error" showIcon message={list.error} style={{ marginBottom: 12 }} />}

      <Table
        rowKey="productId"
        loading={list.loading}
        dataSource={list.data?.items}
        scroll={{ x: 560 }}
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
            title: 'Product',
            render: (_, p) => (
              <div>
                <strong>{p.name}</strong>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                  {p.sku} &bull; {p.categoryName}
                </div>
              </div>
            ),
          },
          {
            title: 'Price',
            align: 'right',
            width: 140,
            render: (_, p) => (
              <span style={{ fontWeight: 600 }}>
                {money(p.price)} / {p.unit}
              </span>
            ),
          },
          {
            title: 'Stock Status',
            width: 120,
            render: (_, p) => (p.inStock ? <Tag color="green">In stock</Tag> : <Tag color="red">Sold out</Tag>),
          },
          ...(canManageProducts
            ? [
                {
                  title: 'Actions',
                  width: 150,
                  render: (_: unknown, p: ProductListItem) => (
                    <span style={{ display: 'flex', gap: 6 }}>
                      <Button size="small" onClick={() => openEdit(p)}>
                        Edit
                      </Button>
                      <Popconfirm
                        title="Remove product"
                        description="Are you sure you want to delete this product?"
                        okText="Remove"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => remove(p.productId)}
                      >
                        <Button size="small" danger>
                          Remove
                        </Button>
                      </Popconfirm>
                    </span>
                  ),
                },
              ]
            : []),
        ]}
      />

      {canManageProducts && (
        <Modal
          title={editing === 'new' ? 'New Product' : 'Edit Product'}
          open={editing !== null}
          onCancel={() => setEditing(null)}
          onOk={save}
          okText="Save Product"
          confirmLoading={saving}
          destroyOnHidden
          width={560}
        >
          <Form form={form} layout="vertical" requiredMark={false} preserve={false}>
            <Form.Item name="name" label="Product Name" rules={[{ required: true, min: 2, max: 150 }]}>
              <Input placeholder="e.g. Organic Jasmine Rice 5kg" />
            </Form.Item>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item name="sku" label="SKU / Barcode" rules={[{ required: true, max: 50 }]}>
                <Input placeholder="RICE-001" />
              </Form.Item>
              <Form.Item name="categoryId" label="Category / Aisle" rules={[{ required: true, message: 'Choose an aisle' }]}>
                <Select
                  placeholder="Select aisle"
                  options={cats.data?.map((c) => ({ value: c.categoryId, label: c.name }))}
                />
              </Form.Item>
              <Form.Item
                name="price"
                label="Unit Price ($)"
                rules={[{ required: true, type: 'number', min: 0.01, message: 'Enter a valid price' }]}
              >
                <InputNumber min={0.01} step={0.05} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="unit" label="Unit Measure" rules={[{ required: true, max: 20 }]}>
                <Input placeholder="pcs, kg, bottle, box…" />
              </Form.Item>
            </div>
            {editing === 'new' && (
              <Form.Item name="initialStock" label="Starting Stock Quantity" rules={[{ type: 'number', min: 0 }]}>
                <InputNumber min={0} precision={0} style={{ width: 180 }} />
              </Form.Item>
            )}
            <Form.Item name="imageUrl" label="Image URL">
              <Input placeholder="https://..." />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={3} placeholder="Detailed product specifications or notes..." />
            </Form.Item>
          </Form>
        </Modal>
      )}
    </>
  );
}
