import type { OrderStatus, PaymentMethod, PaymentStatus, StockMovementType } from '@/types';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const money = (n: number) => usd.format(n);

export const dateTime = (iso?: string) =>
  iso
    ? new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z').toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '';

export const ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Preparing',
  'ReadyForDelivery',
  'OutForDelivery',
  'Delivered',
  'Cancelled',
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  Pending: 'Waiting for payment',
  Confirmed: 'Confirmed',
  Preparing: 'Preparing',
  ReadyForDelivery: 'Ready for delivery',
  OutForDelivery: 'Out for delivery',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  Pending: 'gold',
  Confirmed: 'blue',
  Preparing: 'cyan',
  ReadyForDelivery: 'geekblue',
  OutForDelivery: 'purple',
  Delivered: 'green',
  Cancelled: 'red',
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CashOnDelivery: 'Cash on delivery',
  Khqr: 'Bakong KHQR',
  Card: 'Card',
};

export const PAYMENT_STATUS_COLOR: Record<PaymentStatus, string> = {
  Pending: 'gold',
  Paid: 'green',
  Failed: 'red',
  Cancelled: 'default',
  Refunded: 'purple',
};

// The API sends/accepts some enums as numbers and some as strings, so normalise both ways.
const MOVEMENT_TYPES: StockMovementType[] = ['Purchase', 'Sale', 'Return', 'Adjustment'];
export const movementName = (v: StockMovementType | number): StockMovementType =>
  typeof v === 'number' ? (MOVEMENT_TYPES[v] ?? 'Adjustment') : v;

export const orderStatusNumber = (s: OrderStatus) => ORDER_STATUSES.indexOf(s);

// The API sends UTC timestamps; parse them as UTC even when the "Z" is missing
export const parseUtc = (iso: string) => new Date(/(Z|[+-]\d\d:?\d\d)$/.test(iso) ? iso : iso + 'Z');
