import { Alert, Button, Card, Popconfirm, Result, Skeleton, Typography, message } from 'antd';
import { useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { orderApi } from '@/api';
import OrderBreakdown from '@/components/OrderBreakdown';
import PaymentPanel from '@/components/PaymentPanel';
import { OrderStatusTag, PaymentTag } from '@/components/StatusTags';
import { useAsync } from '@/hooks/useAsync';
import { errorMessage } from '@/utils/errors';
import { dateTime } from '@/utils/format';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, loading, error, reload, setData } = useAsync(async () => (await orderApi.get(Number(id))).data, [id]);
  const refresh = useCallback(() => { void reload(); }, [reload]);

  if (loading && !order) return <div className="page-narrow"><Skeleton active paragraph={{ rows: 8 }} /></div>;
  if (error || !order) return <Result status="404" title="Order not found" subTitle={error ?? undefined} extra={<Button onClick={() => navigate('/orders')}>My orders</Button>} />;

  const cancel = async () => {
    try {
      setData((await orderApi.cancel(order.orderId)).data);
      message.success('Order cancelled');
    } catch (err) {
      message.error(errorMessage(err));
    }
  };

  const needsPayment = order.status === 'Pending' && order.payment?.status !== 'Paid';

  return (
    <div className="page-narrow" style={{ maxWidth: 820, display: 'grid', gap: 16 }}>
      <div className="row-between">
        <div>
          <Typography.Title level={2} className="page-title" style={{ marginBottom: 4 }}>Order #{order.orderId}</Typography.Title>
          <span className="muted">Placed {dateTime(order.createdAt)}</span>
        </div>
        <div><OrderStatusTag status={order.status} />{order.payment && <PaymentTag method={order.payment.method} status={order.payment.status} />}</div>
      </div>

      {order.status === 'Cancelled' && <Alert type="warning" showIcon message="This order was cancelled. Any reserved items went back on the shelf." />}
      {order.status === 'Confirmed' && order.payment?.method === 'CashOnDelivery' && <Alert type="success" showIcon message="Order confirmed. Have the cash ready for the driver." />}
      {order.payment?.status === 'Paid' && order.status !== 'Cancelled' && <Alert type="success" showIcon message="Payment received. We are getting your order ready." />}

      {needsPayment && <PaymentPanel order={order} onChanged={refresh} />}

      <Card><OrderBreakdown order={order} /></Card>

      <div className="row-between">
        <Link to="/orders">Back to my orders</Link>
        {order.canCancel && (
          <Popconfirm title="Cancel this order?" description="Items go back on the shelf." okText="Cancel order" cancelText="Keep order" okButtonProps={{ danger: true }} onConfirm={cancel}>
            <Button danger>Cancel order</Button>
          </Popconfirm>
        )}
      </div>
    </div>
  );
}
