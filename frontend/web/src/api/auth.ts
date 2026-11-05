import api from './client';
import type {
  AuthResponse,
  CustomerResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  VerifyResetCodeRequest,
} from '@/types';

export const authApi = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<AuthResponse>('/auth/register', data),
  me: () => api.get<CustomerResponse>('/auth/me'),
  updateProfile: (data: UpdateProfileRequest) => api.put<CustomerResponse>('/customers/me', data),
  forgotPassword: (data: ForgotPasswordRequest) => api.post<ForgotPasswordResponse>('/auth/forgot-password', data),
  verifyResetCode: (data: VerifyResetCodeRequest) => api.post<{ message: string }>('/auth/verify-reset-code', data),
  resetPassword: (data: ResetPasswordRequest) => api.post<{ message: string }>('/auth/reset-password', data),
};
