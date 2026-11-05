import { apiClient } from './client';
import { AddCartItemRequest, CartItemResponse, CartResponse, UpdateCartItemRequest } from '../types';

export const cartApi = {
  getCart: async (): Promise<CartResponse> => {
    const res = await apiClient.get<CartResponse>('/cart');
    return res.data;
  },

  addItem: async (req: AddCartItemRequest): Promise<CartItemResponse> => {
    const res = await apiClient.post<CartItemResponse>('/cart/items', req);
    return res.data;
  },

  updateItem: async (cartItemId: number, req: UpdateCartItemRequest): Promise<CartItemResponse> => {
    const res = await apiClient.put<CartItemResponse>(`/cart/items/${cartItemId}`, req);
    return res.data;
  },

  removeItem: async (cartItemId: number): Promise<void> => {
    await apiClient.delete(`/cart/items/${cartItemId}`);
  },

  clearCart: async (): Promise<void> => {
    await apiClient.delete('/cart');
  },
};

