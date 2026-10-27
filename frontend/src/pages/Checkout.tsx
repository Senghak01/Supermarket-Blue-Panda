import { Alert, Button, Card, Empty, Radio, Skeleton, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { addressApi, orderApi } from '@/api';
import AddressModal from '@/components/AddressModal';
import { useAsync } from '@/hooks/useAsync';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCart } from '@/store/cartSlice';
import { errorMessage } from '@/utils/errors';
import { money } from '@/utils/format';

export default function Checkout() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cart = useAppSelector((s) => s.cart.cart);
  const addresses = useAsync(async () => (await addressApi.list()).data, []);
  const [chosen, setChosen] = useState<number>();
  const [modal, setModal] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  // Default to the customer's default address until they pick another one
  const addressId = chosen ?? (addresses.data?.find((a) => a.isDefault) ?? addresses.data?.[0])?.addressId;

  if (cart && cart.items.length === 0) return <Navigate to="/cart" replace />;

  const place = async () => {
    if (!addressId) return message.warning('Choose where to deliver your order.');
    setPlacing(true);
    setProblem(null);
    try {
      const { data } = await orderApi.place({ addressId });
      void dispatch(fetchCart());
      navigate(`/orders/${data.orderId}`, { replace: true });
    } catch (err) {
      setProblem(errorMessage(err));
      void dispatch(fetchCart()); // stock may have changed
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 960 }}>
      <Typography.Title level={2} className="page-title">Checkout</Typography.Title>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'start' }}>
        <Card title="Deliver to" extra={<Button type="link" icon={<PlusOutlined />} onClick={() => setModal(true)}>New address</Button>}>
          {addresses.loading ? <Skeleton active /> : addresses.data?.length ? (
            <Radio.Group value={addressId} onChange={(e) => setChosen(e.target.value)} style={{ display: 'grid', gap: 12 }}>
              {addresses.data.map((a) => (
                <Radio key={a.addressId} value={a.addressId}>
                  <strong>{a.label}</strong>{a.isDefault && <span className="muted"> (default)</span>}
                  <div className="muted">{a.recipientName} · {a.phoneNumber}</div>
                  <div className="muted">{[a.addressLine, a.district, a.city].filter(Boolean).join(', ')}</div>
                </Radio>
              ))}
            </Radio.Group>
          ) : <Empty description="Add a delivery address to continue." image={Empty.PRESENTED_IMAGE_SIMPLE}><Button type="primary" onClick={() => setModal(true)}>Add address</Button></Empty>}
        </Card>

        <Card title="Your order">
          {cart?.items.map((i) => (
            <div key={i.cartItemId} className="row-between" style={{ marginBottom: 6 }}>
              <span>{i.quantity} × {i.name}</span><span>{money(i.lineTotal)}</span>
            </div>
          ))}
          <div className="row-between price" style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12 }}>
            <span>Subtotal</span><span>{money(cart?.subtotal ?? 0)}</span>
          </div>
          <p className="muted">Delivery fee is added when you place the order. You choose how to pay on the next screen.</p>
          {problem && <Alert type="error" showIcon message={problem} style={{ marginBottom: 12 }} />}
          <Button type="primary" size="large" block loading={placing} disabled={!addressId || !cart || cart.hasIssues} onClick={place}>
            Place order
          </Button>
        </Card>
      </div>
      <AddressModal
        open={modal}
        onClose={() => setModal(false)}
        onSaved={(a) => { setModal(false); setChosen(a.addressId); void addresses.reload(); }}
      />
    </div>
  );
}
