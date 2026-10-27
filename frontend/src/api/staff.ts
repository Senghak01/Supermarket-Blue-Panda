import api from './client';
import type {
  AdjustStockRequest,
  AdminOrderQuery,
  AdminUserListItem,
  CategoryResponse,
  CreateCategoryRequest,
  CreateProductRequest,
  CreateStaffUserRequest,
  InventoryItemResponse,
  InventoryQuery,
  OrderDetailResponse,
  OrderStatus,
  OrderSummaryResponse,
  PagedResult,
  ProductDetailResponse,
  ProductListItem,
  ProductQuery,
  StockMovementResponse,
  UpdateCategoryRequest,
  UpdateProductRequest,
} from '@/types';
import { orderStatusNumber } from '@/utils/format';

export const inventoryApi = {
  list: (params?: InventoryQuery) => api.get<PagedResult<InventoryItemResponse>>('/inventory', { params }),
  movements: (params?: { productId?: number; page?: number; pageSize?: number }) =>
    api.get<PagedResult<StockMovementResponse>>('/inventory/movements', { params }),
  // movementType is left out on purpose: the API defaults to "Adjustment", and it only
  // accepts numeric enum values unless a string enum converter is added on the server.
  adjust: (data: Pick<AdjustStockRequest, 'productId' | 'deltaQuantity' | 'note'>) =>
    api.post<InventoryItemResponse>('/inventory/adjust', data),
};

export const staffProductApi = {
  list: (params?: ProductQuery) => api.get<PagedResult<ProductListItem>>('/staff/products', { params }),
  get: (id: number) => api.get<ProductDetailResponse>(`/staff/products/${id}`),
};

export const adminUserApi = {
  list: (params?: { search?: string; role?: string; page?: number; pageSize?: number }) =>
    api.get<PagedResult<AdminUserListItem>>('/admin/users', { params }),
  create: (data: CreateStaffUserRequest) => api.post<AdminUserListItem>('/admin/users', data),
  updateRoles: (id: number, roles: string[]) => api.put<AdminUserListItem>(`/admin/users/${id}/roles`, { roles }),
  grant: (id: number, permission: string) => api.post<AdminUserListItem>(`/admin/users/${id}/permissions`, { permission }),
  revoke: (id: number, permission: string) => api.delete<AdminUserListItem>(`/admin/users/${id}/permissions/${permission}`),
  setStatus: (id: number, isActive: boolean) => api.put<AdminUserListItem>(`/admin/users/${id}/status`, { isActive }),
};

export const adminProductApi = {
  create: (data: CreateProductRequest) => api.post<ProductDetailResponse>('/admin/products', data),
  update: (id: number, data: UpdateProductRequest) => api.put<ProductDetailResponse>(`/admin/products/${id}`, data),
  remove: (id: number) => api.delete(`/admin/products/${id}`),
};

export const adminCategoryApi = {
  create: (data: CreateCategoryRequest) => api.post<CategoryResponse>('/admin/categories', data),
  update: (id: number, data: UpdateCategoryRequest) => api.put<CategoryResponse>(`/admin/categories/${id}`, data),
  remove: (id: number) => api.delete(`/admin/categories/${id}`),
};

export const adminOrderApi = {
  list: (params?: AdminOrderQuery) => api.get<PagedResult<OrderSummaryResponse>>('/admin/orders', { params }),
  get: (id: number) => api.get<OrderDetailResponse>(`/admin/orders/${id}`),
  // The API binds this enum from a number, so send the index of the status.
  setStatus: (id: number, status: OrderStatus) =>
    api.put<OrderDetailResponse>(`/admin/orders/${id}/status`, { status: orderStatusNumber(status) }),
};
