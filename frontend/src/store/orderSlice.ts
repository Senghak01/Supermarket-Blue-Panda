import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { orderApi } from '@/api';
import type { Order, CreateOrderRequest, PagedResult } from '@/types';

interface OrderState {
  orders: Order[];
  selectedOrder: Order | null;
  totalCount: number;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
}

const initialState: OrderState = {
  orders: [],
  selectedOrder: null,
  totalCount: 0,
  status: 'idle',
  error: null,
};

export const fetchMyOrders = createAsyncThunk(
  'orders/fetchMine',
  async (params?: { page?: number; pageSize?: number }) => {
    const { data } = await orderApi.getMyOrders(params?.page, params?.pageSize);
    return data;
  },
);

export const placeOrder = createAsyncThunk(
  'orders/place',
  async (dto: CreateOrderRequest, { rejectWithValue }) => {
    try {
      const { data } = await orderApi.placeOrder(dto);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Order failed');
    }
  },
);

export const fetchOrder = createAsyncThunk(
  'orders/fetchOne',
  async (id: number) => {
    const { data } = await orderApi.getOrder(id);
    return data;
  },
);

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyOrders.pending, (s) => { s.status = 'loading'; })
      .addCase(fetchMyOrders.fulfilled, (s, { payload }) => {
        s.status = 'idle';
        const r = payload as PagedResult<Order>;
        s.orders = r.items;
        s.totalCount = r.totalCount;
      })
      .addCase(fetchMyOrders.rejected, (s, a) => {
        s.status = 'failed';
        s.error = a.error.message || 'Failed to load orders';
      });

    builder
      .addCase(placeOrder.pending, (s) => { s.status = 'loading'; })
      .addCase(placeOrder.fulfilled, (s, { payload }) => {
        s.status = 'idle';
        s.selectedOrder = payload;
      })
      .addCase(placeOrder.rejected, (s, a) => {
        s.status = 'failed';
        s.error = a.payload as string;
      });

    builder
      .addCase(fetchOrder.fulfilled, (s, { payload }) => {
        s.selectedOrder = payload;
      });
  },
});

export default orderSlice.reducer;

