import { Alert, Button, Form, Input, Modal, Popconfirm, Table, message } from 'antd';
import { useState } from 'react';
import { adminCategoryApi, catalogApi } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import type { CategoryResponse, CreateCategoryRequest } from '@/types';
import { errorMessage } from '@/utils/errors';

export default function AdminCategories() {
  const list = useAsync(async () => (await catalogApi.categories()).data, []);
  const [editing, setEditing] = useState<CategoryResponse | 'new' | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<CreateCategoryRequest>();

  const open = (c: CategoryResponse | 'new') => {
    form.resetFields();
    setEditing(c);
    if (c !== 'new') form.setFieldsValue({ name: c.name, description: c.description, imageUrl: c.imageUrl });
  };

  const save = async () => {
    const v = await form.validateFields();
    setSaving(true);
    try {
      if (editing === 'new') await adminCategoryApi.create(v);
      else if (editing) await adminCategoryApi.update(editing.categoryId, { ...v, isActive: true });
      message.success('Aisle saved');
      setEditing(null);
      void list.reload();
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    try { await adminCategoryApi.remove(id); message.success('Aisle removed'); void list.reload(); } catch (err) { message.error(errorMessage(err)); }
  };

  return (
    <>
      <div className="row-between" style={{ marginBottom: 16 }}>
        <span className="muted">Aisles group products in the shop.</span>
        <Button type="primary" onClick={() => open('new')}>New aisle</Button>
      </div>
      {list.error && <Alert type="error" showIcon message={list.error} style={{ marginBottom: 12 }} />}
      <Table
        rowKey="categoryId"
        loading={list.loading}
        dataSource={list.data ?? []}
        pagination={false}
        scroll={{ x: 480 }}
        columns={[
          { title: 'Name', dataIndex: 'name' },
          { title: 'Description', dataIndex: 'description', responsive: ['md'] },
          { title: 'Products', dataIndex: 'productCount', align: 'right', width: 100 },
          {
            title: '', width: 150,
            render: (_, c) => (
              <span style={{ display: 'flex', gap: 4 }}>
                <Button size="small" onClick={() => open(c)}>Edit</Button>
                <Popconfirm title="Remove this aisle?" description="Its products will be hidden from the shop too." okText="Remove" okButtonProps={{ danger: true }} onConfirm={() => remove(c.categoryId)}>
                  <Button size="small" danger>Remove</Button>
                </Popconfirm>
              </span>
            ),
          },
        ]}
      />
      <Modal title={editing === 'new' ? 'New aisle' : 'Edit aisle'} open={editing !== null} onCancel={() => setEditing(null)} onOk={save} okText="Save aisle" confirmLoading={saving} destroyOnHidden>
        <Form form={form} layout="vertical" requiredMark={false} preserve={false}>
          <Form.Item name="name" label="Name" rules={[{ required: true, min: 2, max: 100 }]}><Input /></Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="imageUrl" label="Image link"><Input placeholder="https://…" /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
