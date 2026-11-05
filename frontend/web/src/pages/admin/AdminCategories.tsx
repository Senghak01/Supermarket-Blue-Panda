import { Alert, Button, Form, Input, Modal, Popconfirm, Table, Tag, message } from 'antd';
import { useState } from 'react';
import { adminCategoryApi, catalogApi } from '@/api';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import type { CategoryResponse, CreateCategoryRequest } from '@/types';
import { errorMessage } from '@/utils/errors';

export default function AdminCategories() {
  const { isAdmin, hasPermission } = useAuth();
  const canManageCategories = isAdmin || hasPermission('ManageCategories');
  const list = useAsync(async () => (await catalogApi.categories()).data, []);
  const [editing, setEditing] = useState<CategoryResponse | 'new' | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<CreateCategoryRequest>();

  const open = (c: CategoryResponse | 'new') => {
    if (!canManageCategories) return;
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
      message.success('Category saved');
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
      await adminCategoryApi.remove(id);
      message.success('Category removed');
      void list.reload();
    } catch (err) {
      message.error(errorMessage(err));
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <span style={{ color: '#8c8c8c' }}>Store aisles and merchandise classifications.</span>
        </div>
        {canManageCategories ? (
          <Button type="primary" onClick={() => open('new')}>
            + New Category
          </Button>
        ) : (
          <Tag color="default">Read-Only View (Staff)</Tag>
        )}
      </div>

      {!canManageCategories && (
        <Alert
          type="info"
          showIcon
          message="Staff accounts without category management permission have view-only access to store aisles. Adding and modifying aisles requires 'ManageCategories' permission or Administrator role."
          style={{ marginBottom: 12 }}
        />
      )}

      {list.error && <Alert type="error" showIcon message={list.error} style={{ marginBottom: 12 }} />}

      <Table
        rowKey="categoryId"
        loading={list.loading}
        dataSource={list.data ?? []}
        pagination={{ pageSize: 15, hideOnSinglePage: true }}
        columns={[
          {
            title: 'Category Name',
            dataIndex: 'name',
            render: (name, c) => (
              <div>
                <strong>{name}</strong>
                {c.description && <div style={{ color: '#8c8c8c', fontSize: 12 }}>{c.description}</div>}
              </div>
            ),
          },
          {
            title: 'Products Listed',
            dataIndex: 'productCount',
            align: 'right',
            width: 140,
            render: (cnt) => <Tag color="blue">{cnt ?? 0} items</Tag>,
          },
          ...(canManageCategories
            ? [
                {
                  title: 'Actions',
                  width: 150,
                  render: (_: unknown, c: CategoryResponse) => (
                    <span style={{ display: 'flex', gap: 6 }}>
                      <Button size="small" onClick={() => open(c)}>
                        Edit
                      </Button>
                      <Popconfirm
                        title="Remove category"
                        description="Are you sure you want to delete this aisle?"
                        okText="Remove"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => remove(c.categoryId)}
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

      {canManageCategories && (
        <Modal
          title={editing === 'new' ? 'New Category' : 'Edit Category'}
          open={editing !== null}
          onCancel={() => setEditing(null)}
          onOk={save}
          okText="Save Category"
          confirmLoading={saving}
          destroyOnHidden
        >
          <Form form={form} layout="vertical" requiredMark={false} preserve={false}>
            <Form.Item name="name" label="Category Name" rules={[{ required: true, min: 2, max: 100 }]}>
              <Input placeholder="e.g. Beverages, Dairy, Snacks…" />
            </Form.Item>
            <Form.Item name="imageUrl" label="Image URL">
              <Input placeholder="https://..." />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={3} placeholder="Brief description of merchandise in this aisle..." />
            </Form.Item>
          </Form>
        </Modal>
      )}
    </>
  );
}
