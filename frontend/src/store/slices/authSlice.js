import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../services/api.js';

export const checkAuth = createAsyncThunk('auth/checkAuth', async (_, { rejectWithValue }) => {
  try {
    const res = await authApi.getProfile();
    if (res.data?.success && res.data?.user) {
      return res.data.user;
    }
    return null;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Session expired');
  }
});

export const loginUser = createAsyncThunk('auth/loginUser', async (credentials, { rejectWithValue }) => {
  try {
    const res = await authApi.login(credentials);
    if (res.data?.success && res.data?.user) {
      return res.data.user;
    }
    return rejectWithValue(res.data?.message || 'Login failed');
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/registerUser', async (userData, { rejectWithValue }) => {
  try {
    const res = await authApi.register(userData);
    if (res.data?.success && res.data?.user) {
      return res.data.user;
    }
    return rejectWithValue(res.data?.message || 'Registration failed');
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Registration failed');
  }
});

export const logoutUser = createAsyncThunk('auth/logoutUser', async (_, { rejectWithValue }) => {
  try {
    await authApi.logout();
    return null;
  } catch (err) {
    return null;
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: true,
    submitting: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // checkAuth
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.user = null;
        state.loading = false;
      })
      // loginUser
      .addCase(loginUser.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.submitting = false;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload || 'Invalid credentials';
      })
      // registerUser
      .addCase(registerUser.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.submitting = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload || 'Registration failed';
      })
      // logoutUser
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.error = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
