import api from './client';
import type {
  AdminUser,
  CreateUserRequest,
  Product,
  Category,
  Order,
  PagedResult,
} from '@/types';

// ---- Users --------------------------------------------------
export const adminUserApi = {
  getUsers: (params?: { search?: string; role?: string; page?: number; pageSize?: number }) =>
    api.get<PagedResult<AdminUser>>('/admin/users', { params }),

  getUser: (id: number) =>
    api.get<AdminUser>(`/admin/users/${id}`),

  createUser: (data: CreateUserRequest) =>
    api.post('/admin/users', data),

  updateRoles: (id: number, roles: string[]) =>
    api.put(`/admin/users/${id}/roles`, { roles }),

  grantPermission: (id: number, permission: string) =>
    api.post(`/admin/users/${id}/permissions`, { permission }),

  revokePermission: (id: number, permission: string) =>
    api.delete(`/admin/users/${id}/permissions/${permission}`),

  updateStatus: (id: number, isActive: boolean) =>
    api.put(`/admin/users/${id}/status`, { isActive }),
};

// ---- Products -----------------------------------------------
export const adminProductApi = {
  create: (data: Partial<Product>) =>
    api.post('/admin/products', data),

  update: (id: number, data: Partial<Product>) =>
    api.put(`/admin/products/${id}`, data),

  delete: (id: number) =>
    api.delete(`/admin/products/${id}`),
};

// ---- Categories ---------------------------------------------
export const adminCategoryApi = {
  create: (data: Partial<Category>) =>
    api.post('/admin/categories', data),

  update: (id: number, data: Partial<Category>) =>
    api.put(`/admin/categories/${id}`, data),

  delete: (id: number) =>
    api.delete(`/admin/categories/${id}`),
};

// ---- Orders --------------------------------------------------
export const adminOrderApi = {
  getAll: (params?: { status?: string; search?: string; page?: number; pageSize?: number }) =>
    api.get<PagedResult<Order>>('/admin/orders', { params }),

  getOne: (id: number) =>
    api.get<Order>(`/admin/orders/${id}`),

  updateStatus: (id: number, status: string) =>
    api.put(`/admin/orders/${id}/status`, { status }),
};

