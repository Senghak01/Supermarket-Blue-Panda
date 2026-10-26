import api from './client';
import type {
  Product,
  Category,
  ProductFilters,
  PagedResult,
} from '@/types';

export const catalogApi = {
  getProducts: (filters?: ProductFilters) =>
    api.get<PagedResult<Product>>('/products', { params: filters }),

  getProduct: (id: number) =>
    api.get<Product>(`/products/${id}`),

  getCategories: () =>
    api.get<Category[]>('/categories'),

  getCategory: (id: number) =>
    api.get<Category>(`/categories/${id}`),
};

