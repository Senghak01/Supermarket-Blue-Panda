import api from './client';
import type { Order, CreateOrderRequest, PagedResult } from '@/types';

export const orderApi = {
  placeOrder: (data: CreateOrderRequest) =>
    api.post<Order>('/orders', data),

  getMyOrders: (page = 1, pageSize = 10) =>
    api.get<PagedResult<Order>>('/orders/me', { params: { page, pageSize } }),

  getOrder: (id: number) =>
    api.get<Order>(`/orders/${id}`),
};

