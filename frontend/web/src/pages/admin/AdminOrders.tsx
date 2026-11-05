import { Alert, Button, Input, Modal, Popconfirm, Select, Spin, Table, message } from 'antd';
import { useState } from 'react';
import { adminOrderApi } from '@/api';
import OrderBreakdown from '@/components/OrderBreakdown';
import { OrderStatusTag, PaymentTag } from '@/components/StatusTags';
import { useAsync } from '@/hooks/useAsync';
import type { OrderDetailResponse, OrderStatus } from '@/types';
import { errorMessage } from '@/utils/errors';
import { ORDER_STATUSES, ORDER_STATUS_LABEL, dateTime, money } from '@/utils/format';

export default function AdminOrders() {
  const [status, setStatus] = useState<OrderStatus>();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number>();
  const [next, setNext] = useState<OrderStatus>();
  const [saving, setSaving] = useState(false);

  const list = useAsync(async () => (await adminOrderApi.list({ status, search: search || undefined, page, pageSize: 15 })).data, [status, search, page]);
  const detail = useAsync<OrderDetailResponse | null>(async () => (openId ? (await adminOrderApi.get(openId)).data : null), [openId]);
  const order = detail.data;

  const apply = async () => {
    if (!order || !next) return;
    setSaving(true);
    try {
      detail.setData((await adminOrderApi.setStatus(order.orderId, next)).data);
      message.success(`Order #${order.orderId} is now ${ORDER_STATUS_LABEL[next].toLowerCase()}`);
      setNext(undefined);
      void list.reload();
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <Input.Search allowClear placeholder="Order number, name or email" style={{ width: 280 }} onSearch={(v) => { setSearch(v); setPage(1); }} />
        <Select allowClear placeholder="Any status" style={{ minWidth: 190 }} value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] }))} />
      </div>
      {list.error && <Alert type="error" showIcon message={list.error} style={{ marginBottom: 12 }} />}
      <Table
        rowKey="orderId"
        loading={list.loading}
        dataSource={list.data?.items}
        scroll={{ x: 560 }}
        pagination={{ current: page, pageSize: 15, total: list.data?.totalCount ?? 0, onChange: setPage, showSizeChanger: false, hideOnSinglePage: true }}
        columns={[
          { title: 'Order', render: (_, o) => `#${o.orderId}` },
          { title: 'Placed', render: (_, o) => dateTime(o.createdAt) },
          { title: 'Items', dataIndex: 'itemCount', align: 'right' },
          { title: 'Total', align: 'right', render: (_, o) => <span className="price">{money(o.totalAmount)}</span> },
          { title: 'Status', render: (_, o) => <OrderStatusTag status={o.status} /> },
          { title: '', width: 90, render: (_, o) => <Button size="small" onClick={() => { setOpenId(o.orderId); setNext(undefined); }}>Open</Button> },
        ]}
      />
      <Modal title={`Order #${openId ?? ''}`} open={!!openId} onCancel={() => setOpenId(undefined)} footer={null} width={720} destroyOnHidden>
        {detail.loading && !order ? <Spin /> : order && (
          <>
            <div className="row-between" style={{ marginBottom: 12 }}>
              <span><OrderStatusTag status={order.status} />{order.payment && <PaymentTag method={order.payment.method} status={order.payment.status} />}</span>
              <span className="muted">Placed {dateTime(order.createdAt)}</span>
            </div>
            <OrderBreakdown order={order} />
            <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <span>Move to</span>
              <Select style={{ minWidth: 200 }} value={next} onChange={setNext} placeholder="Choose a status" options={ORDER_STATUSES.filter((s) => s !== order.status).map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] }))} />
              {next === 'Cancelled' ? (
                <Popconfirm title="Cancel this order?" description="Reserved stock goes back on the shelf." okText="Cancel order" okButtonProps={{ danger: true }} onConfirm={apply}>
                  <Button danger loading={saving}>Update status</Button>
                </Popconfirm>
              ) : <Button type="primary" disabled={!next} loading={saving} onClick={apply}>Update status</Button>}
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
