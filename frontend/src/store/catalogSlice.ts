import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { catalogApi } from '@/api';
import type { Product, Category, ProductFilters, PagedResult } from '@/types';

interface CatalogState {
  products: Product[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  filters: ProductFilters;
  categories: Category[];
  selectedProduct: Product | null;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
}

const initialState: CatalogState = {
  products: [],
  totalCount: 0,
  totalPages: 0,
  currentPage: 1,
  pageSize: 12,
  filters: {},
  categories: [],
  selectedProduct: null,
  status: 'idle',
  error: null,
};

export const fetchProducts = createAsyncThunk(
  'catalog/fetchProducts',
  async (filters: ProductFilters | undefined, { getState }) => {
    const state = getState() as { catalog: CatalogState };
    const merged = { ...state.catalog.filters, ...filters };
    const { data } = await catalogApi.getProducts(merged);
    return { result: data, filters: merged };
  },
);

export const fetchProduct = createAsyncThunk(
  'catalog/fetchProduct',
  async (id: number) => {
    const { data } = await catalogApi.getProduct(id);
    return data;
  },
);

export const fetchCategories = createAsyncThunk(
  'catalog/fetchCategories',
  async () => {
    const { data } = await catalogApi.getCategories();
    return data;
  },
);

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters(state) {
      state.filters = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (s) => { s.status = 'loading'; })
      .addCase(fetchProducts.fulfilled, (s, { payload }) => {
        s.status = 'idle';
        const r = payload.result as PagedResult<Product>;
        s.products = r.items;
        s.totalCount = r.totalCount;
        s.totalPages = r.totalPages;
        s.currentPage = r.page;
        s.pageSize = r.pageSize;
        s.filters = payload.filters;
      })
      .addCase(fetchProducts.rejected, (s, a) => {
        s.status = 'failed';
        s.error = a.error.message || 'Failed to load products';
      });

    builder
      .addCase(fetchProduct.fulfilled, (s, { payload }) => {
        s.selectedProduct = payload;
      });

    builder
      .addCase(fetchCategories.fulfilled, (s, { payload }) => {
        s.categories = payload;
      });
  },
});

export const { setFilters, clearFilters } = catalogSlice.actions;
export default catalogSlice.reducer;

