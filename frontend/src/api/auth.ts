import api from './client';
import type { AuthResponse, CustomerResponse, LoginRequest, RegisterRequest, UpdateProfileRequest } from '@/types';

export const authApi = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<AuthResponse>('/auth/register', data),
  me: () => api.get<CustomerResponse>('/auth/me'),
  updateProfile: (data: UpdateProfileRequest) => api.put<CustomerResponse>('/customers/me', data),
};
