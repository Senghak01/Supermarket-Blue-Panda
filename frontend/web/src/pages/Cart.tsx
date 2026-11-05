import { Alert, Button, Empty, InputNumber, Popconfirm, Table, Tag, Typography, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearCart, removeCartItem, updateCartItem } from '@/store/cartSlice';
import type { CartItemResponse } from '@/types';
import { money } from '@/utils/format';

export default function Cart() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { cart, busy } = useAppSelector((s) => s.cart);

  const change = async (item: CartItemResponse, quantity: number) => {
    const res = await dispatch(updateCartItem({ cartItemId: item.cartItemId, quantity }));
    if (updateCartItem.rejected.match(res)) message.error((res.payload as string) ?? 'Could not update the quantity');
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="page">
        <Typography.Title level={2} className="page-title">Your cart</Typography.Title>
        <Empty description="Your cart is empty."><Button type="primary" onClick={() => navigate('/catalog')}>Browse the shop</Button></Empty>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="row-between">
        <Typography.Title level={2} className="page-title">Your cart</Typography.Title>
        <Popconfirm title="Remove everything from your cart?" okText="Clear cart" onConfirm={() => dispatch(clearCart())}>
          <Button type="link" danger>Clear cart</Button>
        </Popconfirm>
      </div>

      {cart.hasIssues && <Alert type="warning" showIcon style={{ marginBottom: 16 }} message="Some items need your attention before checkout. Lower the quantity or remove them." />}

      <Table
        rowKey="cartItemId"
        pagination={false}
        loading={busy}
        dataSource={cart.items}
        scroll={{ x: 560 }}
        columns={[
          {
            title: 'Item',
            render: (_, i) => (
              <div>
                <Link to={`/products/${i.productId}`}><strong>{i.name}</strong></Link>
                <div className="muted">{money(i.unitPrice)} / {i.unit}</div>
                {!i.isAvailable && <Tag color="red">Unavailable</Tag>}
                {i.isAvailable && !i.canCheckout && <Tag color="orange">Only {i.availableQuantity} available</Tag>}
              </div>
            ),
          },
          {
            title: 'Quantity',
            width: 130,
            render: (_, i) => <InputNumber min={1} max={Math.max(i.availableQuantity, 1)} value={i.quantity} onChange={(v) => v && v !== i.quantity && change(i, v)} aria-label={`Quantity of ${i.name}`} />,
          },
          { title: 'Total', width: 110, align: 'right', render: (_, i) => <span className="price">{money(i.lineTotal)}</span> },
          { width: 56, render: (_, i) => <Button type="text" danger aria-label={`Remove ${i.name}`} icon={<DeleteOutlined />} onClick={() => dispatch(removeCartItem(i.cartItemId))} /> },
        ]}
      />

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <div style={{ fontSize: 18 }}>Subtotal <span className="price">{money(cart.subtotal)}</span></div>
        <div className="muted">Delivery fee is added when you place the order.</div>
        <Button type="primary" size="large" disabled={cart.hasIssues} onClick={() => navigate('/checkout')} style={{ marginTop: 8 }}>
          Continue to checkout
        </Button>
      </div>
    </div>
  );
}
