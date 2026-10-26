import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { inventoryApi } from '@/api';
import type { InventoryItem, StockMovement, StockAdjustRequest, PagedResult } from '@/types';

interface InventoryState {
  items: InventoryItem[];
  movements: StockMovement[];
  totalCount: number;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
}

const initialState: InventoryState = {
  items: [],
  movements: [],
  totalCount: 0,
  status: 'idle',
  error: null,
};

export const fetchInventory = createAsyncThunk(
  'inventory/fetch',
  async (params?: { search?: string; lowStockOnly?: boolean; page?: number; pageSize?: number }) => {
    const { data } = await inventoryApi.getInventory(params);
    return data;
  },
);

export const fetchMovements = createAsyncThunk(
  'inventory/movements',
  async (params?: { productId?: number; page?: number; pageSize?: number }) => {
    const { data } = await inventoryApi.getMovements(params);
    return data;
  },
);

export const adjustStock = createAsyncThunk(
  'inventory/adjust',
  async (dto: StockAdjustRequest, { rejectWithValue }) => {
    try {
      await inventoryApi.adjustStock(dto);
      return dto;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Adjustment failed');
    }
  },
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventory.pending, (s) => { s.status = 'loading'; })
      .addCase(fetchInventory.fulfilled, (s, { payload }) => {
        s.status = 'idle';
        const r = payload as PagedResult<InventoryItem>;
        s.items = r.items;
        s.totalCount = r.totalCount;
      })
      .addCase(fetchInventory.rejected, (s, a) => {
        s.status = 'failed';
        s.error = a.error.message || 'Failed';
      });

    builder
      .addCase(fetchMovements.fulfilled, (s, { payload }) => {
        const r = payload as PagedResult<StockMovement>;
        s.movements = r.items;
      });

    builder
      .addCase(adjustStock.fulfilled, (s) => {
        s.status = 'idle';
      })
      .addCase(adjustStock.rejected, (s, a) => {
        s.status = 'failed';
        s.error = a.payload as string;
      });
  },
});

export default inventorySlice.reducer;

