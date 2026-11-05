import { apiClient } from './client';
import {
  OrderDetailResponse,
  OrderSummaryResponse,
  PagedResult,
  PlaceOrderRequest,
} from '../types';

export const ordersApi = {
  getOrders: async (page = 1, pageSize = 10): Promise<PagedResult<OrderSummaryResponse>> => {
    const res = await apiClient.get<PagedResult<OrderSummaryResponse>>('/orders', {
      params: { page, pageSize },
    });
    return res.data;
  },

  getOrderById: async (orderId: number): Promise<OrderDetailResponse> => {
    const res = await apiClient.get<OrderDetailResponse>(`/orders/${orderId}`);
    return res.data;
  },

  placeOrder: async (req: PlaceOrderRequest): Promise<OrderDetailResponse> => {
    const res = await apiClient.post<OrderDetailResponse>('/orders', req);
    return res.data;
  },

  cancelOrder: async (orderId: number): Promise<OrderDetailResponse> => {
    const res = await apiClient.post<OrderDetailResponse>(`/orders/${orderId}/cancel`);
    return res.data;
  },
};

