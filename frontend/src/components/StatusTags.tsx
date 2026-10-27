import { Tag } from 'antd';
import type { OrderStatus, PaymentMethod, PaymentStatus } from '@/types';
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_COLOR } from '@/utils/format';

export const OrderStatusTag = ({ status }: { status: OrderStatus }) => (
  <Tag color={ORDER_STATUS_COLOR[status]}>{ORDER_STATUS_LABEL[status]}</Tag>
);

export const PaymentTag = ({ method, status }: { method: PaymentMethod; status: PaymentStatus }) => (
  <Tag color={PAYMENT_STATUS_COLOR[status]}>
    {PAYMENT_METHOD_LABEL[method]}: {status === 'Pending' && method === 'CashOnDelivery' ? 'pay on delivery' : status.toLowerCase()}
  </Tag>
);
