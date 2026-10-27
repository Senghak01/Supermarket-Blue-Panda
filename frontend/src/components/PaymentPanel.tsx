import { Alert, Button, Card, Space, Typography, message } from 'antd';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { paymentApi } from '@/api';
import type { OrderDetailResponse, PaymentMethod, PaymentResponse } from '@/types';
import { errorMessage } from '@/utils/errors';
import { PAYMENT_METHOD_LABEL, money, parseUtc } from '@/utils/format';

// The API only returns the QR code in the answer to "start payment", so keep it for page reloads
const KEY = (orderId: number) => `pay:${orderId}`;
const loadSaved = (orderId: number): PaymentResponse | null => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY(orderId)) ?? 'null');
  } catch {
    return null;
  }
};

interface Props {
  order: OrderDetailResponse;
  onChanged: () => void;
}

export default function PaymentPanel({ order, onChanged }: Props) {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<PaymentResponse | null>(() => loadSaved(order.orderId));
  const [now, setNow] = useState(() => Date.now());

  const pendingOnline = order.payment?.status === 'Pending' && order.payment.method !== 'CashOnDelivery' ? order.payment : null;
  const active = pendingOnline && saved?.paymentId === pendingOnline.paymentId ? saved : null;
  const expiresAt = active?.expiresAt ? parseUtc(active.expiresAt).getTime() : null;
  const remaining = expiresAt ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : null;

  // Ask the server every 5 seconds whether the customer has paid
  useEffect(() => {
    if (!active) return;
    let n = 0;
    const tick = setInterval(async () => {
      setNow(Date.now());
      if (++n % 5 !== 0) return;
      try {
        const res = (await paymentApi.check(active.paymentId)).data;
        if (res.status !== 'Pending') {
          sessionStorage.removeItem(KEY(order.orderId));
          onChanged();
        } else if (expiresAt && Date.now() > expiresAt) {
          onChanged();
        }
      } catch {
        /* keep waiting; the next tick tries again */
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [active, expiresAt, order.orderId, onChanged]);

  const start = async (method: PaymentMethod) => {
    setBusy(true);
    try {
      const res = (await paymentApi.initiate(order.orderId, { method })).data;
      if (method === 'CashOnDelivery') {
        message.success('Order confirmed. Pay the driver in cash on delivery.');
      } else {
        sessionStorage.setItem(KEY(order.orderId), JSON.stringify(res));
        setSaved(res);
      }
      onChanged();
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  // Lost the QR (new device or cleared storage): check first, so a payment that already went
  // through is not replaced, then ask for a fresh QR.
  const showAgain = async () => {
    if (!pendingOnline) return;
    setBusy(true);
    try {
      const check = (await paymentApi.check(pendingOnline.paymentId)).data;
      if (check.status !== 'Pending') return onChanged();
    } catch {
      /* fall through to a new QR */
    } finally {
      setBusy(false);
    }
    await start(pendingOnline.method);
  };

  if (active) {
    return (
      <Card title={`Pay with ${PAYMENT_METHOD_LABEL[active.method]}`}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          {active.qrData && (
            <div style={{ background: '#fff', padding: 12, border: '1px solid var(--line)', borderRadius: 8 }}>
              <QRCodeSVG value={active.qrData} size={220} role="img" aria-label="Payment QR code" />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 220 }}>
            <p className="display" style={{ fontSize: 28, margin: 0 }}>{money(active.amount)}</p>
            <p>Open your banking app, scan the code and confirm. This page updates when your payment arrives.</p>
            {remaining !== null && (
              <p className="muted">
                {remaining > 0 ? `Pay within ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}. After that the order is cancelled.` : 'Time is up. The order will be cancelled shortly.'}
              </p>
            )}
            {active.paymentUrl && <Button type="link" href={active.paymentUrl} target="_blank" rel="noreferrer" style={{ paddingLeft: 0 }}>Open payment page</Button>}
            {import.meta.env.DEV && (
              <Button onClick={async () => { await paymentApi.sandboxConfirm(active.paymentId); onChanged(); }}>
                Simulate payment (development only)
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (pendingOnline) {
    return (
      <Alert
        type="info"
        showIcon
        message={`Waiting for your ${PAYMENT_METHOD_LABEL[pendingOnline.method]} payment`}
        description="The QR code is not available on this device."
        action={<Button loading={busy} onClick={showAgain}>Show the QR again</Button>}
      />
    );
  }

  const methods: { method: PaymentMethod; title: string; text: string }[] = [
    { method: 'Khqr', title: 'Bakong KHQR', text: 'Scan with any Cambodian banking app. Paid in seconds.' },
    { method: 'CashOnDelivery', title: 'Cash on delivery', text: 'Pay the driver when your groceries arrive.' },
    ...(import.meta.env.DEV ? [{ method: 'Card' as PaymentMethod, title: 'Card (test)', text: 'Development sandbox only.' }] : []),
  ];

  return (
    <Card title="How would you like to pay?">
      <Space wrap size={12} style={{ width: '100%' }}>
        {methods.map((m) => (
          <Button key={m.method} disabled={busy} onClick={() => start(m.method)} style={{ height: 'auto', padding: '12px 16px', textAlign: 'left', whiteSpace: 'normal', minWidth: 230 }}>
            <Typography.Text strong style={{ display: 'block' }}>{m.title}</Typography.Text>
            <Typography.Text type="secondary">{m.text}</Typography.Text>
          </Button>
        ))}
      </Space>
    </Card>
  );
}
