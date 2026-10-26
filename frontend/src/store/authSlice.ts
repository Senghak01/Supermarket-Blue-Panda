import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';
import { authApi } from '@/api';
import type { User, DecodedToken, LoginRequest, RegisterRequest } from '@/types';

interface AuthState {
  token: string | null;
  user: User | null;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
}

function decodeUser(token: string): User {
  const decoded = jwtDecode<DecodedToken>(token);
  const permissions = Array.isArray(decoded.permission)
    ? decoded.permission
    : decoded.permission
      ? [decoded.permission]
      : [];
  return {
    email: decoded.email,
    name: decoded.name || decoded.email,
    role: decoded.role || 'Customer',
    permissions,
  };
}

// Restore from localStorage on load
const savedToken = localStorage.getItem('jwt');
let savedUser: User | null = null;
if (savedToken) {
  try {
    const decoded = jwtDecode<DecodedToken>(savedToken);
    if (decoded.exp * 1000 > Date.now()) {
      savedUser = decodeUser(savedToken);
    } else {
      localStorage.removeItem('jwt');
    }
  } catch {
    localStorage.removeItem('jwt');
  }
}

const initialState: AuthState = {
  token: savedUser ? savedToken : null,
  user: savedUser,
  status: 'idle',
  error: null,
};

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const { data } = await authApi.login(credentials);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  },
);

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (payload: RegisterRequest, { rejectWithValue }) => {
    try {
      const { data } = await authApi.register(payload);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.error = null;
      localStorage.removeItem('jwt');
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, { payload }) => {
        state.status = 'idle';
        state.token = payload.token;
        state.user = decodeUser(payload.token);
        localStorage.setItem('jwt', payload.token);
      })
      .addCase(loginThunk.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload as string;
      });

    // Register
    builder
      .addCase(registerThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, { payload }) => {
        state.status = 'idle';
        state.token = payload.token;
        state.user = decodeUser(payload.token);
        localStorage.setItem('jwt', payload.token);
      })
      .addCase(registerThunk.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload as string;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;

