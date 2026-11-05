import { apiClient } from './client';
import {
  AuthResponse,
  CustomerResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  VerifyResetCodeRequest,
} from '../types';

export const authApi = {
  login: async (req: LoginRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', req);
    return res.data;
  },

  register: async (req: RegisterRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', req);
    return res.data;
  },

  forgotPassword: async (req: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
    const res = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', req);
    return res.data;
  },

  verifyResetCode: async (req: VerifyResetCodeRequest): Promise<{ message: string; valid: boolean }> => {
    const res = await apiClient.post<{ message: string; valid: boolean }>('/auth/verify-reset-code', req);
    return res.data;
  },

  resetPassword: async (req: ResetPasswordRequest): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>('/auth/reset-password', req);
    return res.data;
  },

  getProfile: async (): Promise<CustomerResponse> => {
    const res = await apiClient.get<CustomerResponse>('/customers/me');
    return res.data;
  },

  updateProfile: async (req: UpdateProfileRequest): Promise<CustomerResponse> => {
    const res = await apiClient.put<CustomerResponse>('/customers/me', req);
    return res.data;
  },
};

