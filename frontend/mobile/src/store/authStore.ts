import { create } from 'zustand';
import { authApi } from '../api/auth';
import { CustomerResponse, LoginRequest, RegisterRequest } from '../types';
import { getItem, removeItem, setItem } from '../utils/storage';

interface AuthState {
  token: string | null;
  customer: CustomerResponse | null;
  isLoading: boolean;
  isInitializing: boolean;
  login: (req: LoginRequest) => Promise<void>;
  register: (req: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setCustomer: (customer: CustomerResponse) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  customer: null,
  isLoading: false,
  isInitializing: true,

  checkAuth: async () => {
    try {
      const token = await getItem('auth_token');
      if (!token) {
        set({ token: null, customer: null, isInitializing: false });
        return;
      }
      const customerStr = await getItem('customer_info');
      const customer = customerStr ? JSON.parse(customerStr) : null;
      set({ token, customer, isInitializing: false });

      // Fetch fresh profile in background
      try {
        const freshCustomer = await authApi.getProfile();
        await setItem('customer_info', JSON.stringify(freshCustomer));
        set({ customer: freshCustomer });
      } catch {
        // If token expired or invalid
      }
    } catch {
      set({ token: null, customer: null, isInitializing: false });
    }
  },

  login: async (req: LoginRequest) => {
    set({ isLoading: true });
    try {
      const data = await authApi.login(req);
      await setItem('auth_token', data.token);
      await setItem('customer_info', JSON.stringify(data.customer));
      set({ token: data.token, customer: data.customer, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (req: RegisterRequest) => {
    set({ isLoading: true });
    try {
      const data = await authApi.register(req);
      await setItem('auth_token', data.token);
      await setItem('customer_info', JSON.stringify(data.customer));
      set({ token: data.token, customer: data.customer, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await removeItem('auth_token');
    await removeItem('customer_info');
    set({ token: null, customer: null });
  },

  setCustomer: (customer: CustomerResponse) => {
    set({ customer });
    setItem('customer_info', JSON.stringify(customer)).catch(() => {});
  },
}));

