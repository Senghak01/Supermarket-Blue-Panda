import api from './client';
import type {
  InventoryItem,
  StockMovement,
  StockAdjustRequest,
  PagedResult,
} from '@/types';

export const inventoryApi = {
  getInventory: (params?: { search?: string; lowStockOnly?: boolean; page?: number; pageSize?: number }) =>
    api.get<PagedResult<InventoryItem>>('/inventory', { params }),

  getProductInventory: (productId: number) =>
    api.get<InventoryItem>(`/inventory/${productId}`),

  getMovements: (params?: { productId?: number; page?: number; pageSize?: number }) =>
    api.get<PagedResult<StockMovement>>('/inventory/movements', { params }),

  adjustStock: (data: StockAdjustRequest) =>
    api.post('/inventory/adjust', data),
};

