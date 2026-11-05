import { create } from 'zustand';
import { cartApi } from '../api/cart';
import { CartResponse } from '../types';

interface CartState {
  cart: CartResponse | null;
  itemCount: number;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  removeItem: (cartItemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  resetCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  itemCount: 0,
  isLoading: false,

  fetchCart: async () => {
    try {
      set({ isLoading: true });
      const cart = await cartApi.getCart();
      set({ cart, itemCount: cart.itemCount, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (productId: number, quantity = 1) => {
    set({ isLoading: true });
    try {
      await cartApi.addItem({ productId, quantity });
      await get().fetchCart();
    } finally {
      set({ isLoading: false });
    }
  },

  updateQuantity: async (cartItemId: number, quantity: number) => {
    set({ isLoading: true });
    try {
      await cartApi.updateItem(cartItemId, { quantity });
      await get().fetchCart();
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (cartItemId: number) => {
    set({ isLoading: true });
    try {
      await cartApi.removeItem(cartItemId);
      await get().fetchCart();
    } finally {
      set({ isLoading: false });
    }
  },

  clearCart: async () => {
    set({ isLoading: true });
    try {
      await cartApi.clearCart();
      set({ cart: null, itemCount: 0, isLoading: false });
    } finally {
      set({ isLoading: false });
    }
  },

  resetCart: () => {
    set({ cart: null, itemCount: 0 });
  },
}));

