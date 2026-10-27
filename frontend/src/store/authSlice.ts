import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';
import { authApi } from '@/api';
import { TOKEN_KEY } from '@/api/client';
import type { DecodedToken, LoginRequest, RegisterRequest, User } from '@/types';
import { errorMessage } from '@/utils/errors';

interface AuthState {
  token: string | null;
  user: User | null;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
}

const NS = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/';
const CLAIMS = {
  id: [NS + 'nameidentifier', 'nameid', 'sub'],
  email: [NS + 'emailaddress', 'email'],
  name: [NS + 'name', 'unique_name', 'name'],
  role: ['http://schemas.microsoft.com/ws/2008/06/identity/claims/role', 'role', 'roles'],
  permission: ['permission'],
};

function claim(d: DecodedToken, keys: string[]): string[] {
  for (const k of keys) {
    const v = d[k];
    if (v !== undefined && v !== null) return (Array.isArray(v) ? v : [v]).map(String);
  }
  return [];
}

export function decodeUser(token: string): User {
  const d = jwtDecode<DecodedToken>(token);
  const roles = claim(d, CLAIMS.role);
  return {
    customerId: Number(claim(d, CLAIMS.id)[0] ?? 0),
    email: claim(d, CLAIMS.email)[0] ?? '',
    username: claim(d, CLAIMS.name)[0] ?? '',
    roles: roles.length ? roles : ['Customer'],
    permissions: claim(d, CLAIMS.permission),
  };
}

// Restore the session on page load, but only if the token has not expired
function restore(): { token: string | null; user: User | null } {
  const saved = localStorage.getItem(TOKEN_KEY);
  if (!saved) return { token: null, user: null };
  try {
    const { exp } = jwtDecode<DecodedToken>(saved);
    if (exp * 1000 > Date.now()) return { token: saved, user: decodeUser(saved) };
  } catch {
    /* fall through */
  }
  localStorage.removeItem(TOKEN_KEY);
  return { token: null, user: null };
}

const initialState: AuthState = { ...restore(), status: 'idle', error: null };

export const loginThunk = createAsyncThunk('auth/login', async (body: LoginRequest, { rejectWithValue }) => {
  try {
    return (await authApi.login(body)).data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Login failed'));
  }
});

export const registerThunk = createAsyncThunk('auth/register', async (body: RegisterRequest, { rejectWithValue }) => {
  try {
    return (await authApi.register(body)).data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Registration failed'));
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.error = null;
      localStorage.removeItem(TOKEN_KEY);
    },
    clearError(state) {
      state.error = null;
    },
    setUsername(state, action: { payload: string }) {
      if (state.user) state.user.username = action.payload;
    },
  },
  extraReducers: (builder) => {
    for (const thunk of [loginThunk, registerThunk]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.status = 'loading';
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state, { payload }) => {
          state.status = 'idle';
          state.token = payload.token;
          state.user = decodeUser(payload.token);
          localStorage.setItem(TOKEN_KEY, payload.token);
        })
        .addCase(thunk.rejected, (state, { payload }) => {
          state.status = 'failed';
          state.error = (payload as string) ?? 'Something went wrong';
        });
    }
  },
});

export const { logout, clearError, setUsername } = authSlice.actions;
export default authSlice.reducer;
