import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { cartApi } from '@/api';
import type { CartResponse } from '@/types';
import { errorMessage } from '@/utils/errors';
import { logout } from './authSlice';

interface CartState {
  cart: CartResponse | null;
  busy: boolean;
}

const wrap = <A>(fn: (arg: A) => Promise<{ data: CartResponse }>) => async (arg: A, { rejectWithValue }: { rejectWithValue: (v: string) => unknown }) => {
  try {
    return (await fn(arg)).data;
  } catch (err) {
    return rejectWithValue(errorMessage(err)) as never;
  }
};

// The cart lives on the server (stock is checked there), so every change returns the fresh cart.
export const fetchCart = createAsyncThunk('cart/fetch', wrap<void>(() => cartApi.get()));
export const addToCart = createAsyncThunk('cart/add', wrap((a: { productId: number; quantity?: number }) => cartApi.add(a)));
export const updateCartItem = createAsyncThunk(
  'cart/update',
  wrap((a: { cartItemId: number; quantity: number }) => cartApi.update(a.cartItemId, a.quantity)),
);
export const removeCartItem = createAsyncThunk('cart/remove', wrap((cartItemId: number) => cartApi.remove(cartItemId)));
export const clearCart = createAsyncThunk('cart/clear', async (_: void, { rejectWithValue }) => {
  try {
    await cartApi.clear();
    return { items: [], itemCount: 0, subtotal: 0, hasIssues: false } as CartResponse;
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: { cart: null, busy: false } as CartState,
  reducers: {
    resetCart(state) {
      state.cart = null;
    },
  },
  extraReducers: (builder) => {
    for (const t of [fetchCart, addToCart, updateCartItem, removeCartItem, clearCart]) {
      builder
        .addCase(t.pending, (s) => {
          s.busy = true;
        })
        .addCase(t.fulfilled, (s, { payload }) => {
          s.busy = false;
          s.cart = payload as CartResponse;
        })
        .addCase(t.rejected, (s) => {
          s.busy = false;
        });
    }
    builder.addCase(logout, (s) => {
      s.cart = null;
    });
  },
});

export const { resetCart } = cartSlice.actions;
export default cartSlice.reducer;
