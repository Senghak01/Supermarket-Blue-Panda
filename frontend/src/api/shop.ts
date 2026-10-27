import api from './client';
import type {
  AddCartItemRequest,
  AddressResponse,
  CartResponse,
  CategoryResponse,
  CreateAddressRequest,
  InitiatePaymentRequest,
  OrderDetailResponse,
  OrderSummaryResponse,
  PagedResult,
  PaymentResponse,
  PlaceOrderRequest,
  ProductDetailResponse,
  ProductListItem,
  ProductQuery,
  UpdateAddressRequest,
} from '@/types';

export const catalogApi = {
  products: (params?: ProductQuery) => api.get<PagedResult<ProductListItem>>('/products', { params }),
  product: (id: number) => api.get<ProductDetailResponse>(`/products/${id}`),
  categories: () => api.get<CategoryResponse[]>('/categories'),
};

export const cartApi = {
  get: () => api.get<CartResponse>('/cart'),
  add: (data: AddCartItemRequest) => api.post<CartResponse>('/cart/items', data),
  update: (cartItemId: number, quantity: number) => api.put<CartResponse>(`/cart/items/${cartItemId}`, { quantity }),
  remove: (cartItemId: number) => api.delete<CartResponse>(`/cart/items/${cartItemId}`),
  clear: () => api.delete('/cart'),
};

export const addressApi = {
  list: () => api.get<AddressResponse[]>('/addresses'),
  create: (data: CreateAddressRequest) => api.post<AddressResponse>('/addresses', data),
  update: (id: number, data: UpdateAddressRequest) => api.put<AddressResponse>(`/addresses/${id}`, data),
  setDefault: (id: number) => api.put<AddressResponse>(`/addresses/${id}/default`),
  remove: (id: number) => api.delete(`/addresses/${id}`),
};

export const orderApi = {
  place: (data: PlaceOrderRequest) => api.post<OrderDetailResponse>('/orders', data),
  list: (page = 1, pageSize = 10) => api.get<PagedResult<OrderSummaryResponse>>('/orders', { params: { page, pageSize } }),
  get: (id: number) => api.get<OrderDetailResponse>(`/orders/${id}`),
  cancel: (id: number) => api.post<OrderDetailResponse>(`/orders/${id}/cancel`),
};

export const paymentApi = {
  initiate: (orderId: number, data: InitiatePaymentRequest) => api.post<PaymentResponse>(`/orders/${orderId}/payments`, data),
  forOrder: (orderId: number) => api.get<PaymentResponse[]>(`/orders/${orderId}/payments`),
  check: (paymentId: number) => api.post<PaymentResponse>(`/payments/${paymentId}/check`),
  sandboxConfirm: (paymentId: number) => api.post<PaymentResponse>(`/payments/${paymentId}/sandbox-confirm`),
};
