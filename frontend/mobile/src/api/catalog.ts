import { apiClient } from './client';
import {
  CategoryResponse,
  PagedResult,
  ProductDetailResponse,
  ProductListItem,
  ProductQuery,
} from '../types';

export const catalogApi = {
  getCategories: async (): Promise<CategoryResponse[]> => {
    const res = await apiClient.get<CategoryResponse[]>('/categories');
    return res.data;
  },

  getProducts: async (params?: ProductQuery): Promise<PagedResult<ProductListItem>> => {
    const res = await apiClient.get<PagedResult<ProductListItem>>('/products', { params });
    return res.data;
  },

  getProductById: async (productId: number): Promise<ProductDetailResponse> => {
    const res = await apiClient.get<ProductDetailResponse>(`/products/${productId}`);
    return res.data;
  },
};

