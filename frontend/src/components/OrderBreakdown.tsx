import { Descriptions, Table } from 'antd';
import type { OrderDetailResponse } from '@/types';
import { money } from '@/utils/format';

// Items, totals and delivery address of one order (used by customers and admins)
export default function OrderBreakdown({ order }: { order: OrderDetailResponse }) {
  const a = order.deliveryAddress;
  return (
    <>
      <Table
        size="small"
        rowKey={(i) => i.productId}
        pagination={false}
        dataSource={order.items}
        scroll={{ x: 420 }}
        columns={[
          { title: 'Item', dataIndex: 'productName' },
          { title: 'Price', width: 90, align: 'right', render: (_, i) => money(i.unitPrice) },
          { title: 'Qty', width: 60, align: 'right', dataIndex: 'quantity' },
          { title: 'Total', width: 100, align: 'right', render: (_, i) => <span className="price">{money(i.subtotal)}</span> },
        ]}
      />
      <div style={{ marginTop: 12, marginLeft: 'auto', maxWidth: 260 }}>
        <div className="row-between"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
        <div className="row-between"><span>Delivery</span><span>{order.deliveryFee === 0 ? 'Free' : money(order.deliveryFee)}</span></div>
        {order.discount > 0 && <div className="row-between"><span>Discount</span><span>-{money(order.discount)}</span></div>}
        <div className="row-between price" style={{ fontSize: 18, marginTop: 4 }}><span>Total</span><span>{money(order.totalAmount)}</span></div>
      </div>
      {a && (
        <Descriptions size="small" column={1} style={{ marginTop: 16 }} title="Deliver to">
          <Descriptions.Item label="Recipient">{a.recipientName} · {a.phoneNumber}</Descriptions.Item>
          <Descriptions.Item label="Address">{[a.addressLine, a.district, a.city].filter(Boolean).join(', ')}</Descriptions.Item>
          {a.note && <Descriptions.Item label="Note">{a.note}</Descriptions.Item>}
        </Descriptions>
      )}
    </>
  );
}
