import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { safeStorage } from '../utils/safeStorage';

// Thunks
export const login = createAsyncThunk('auth/login', async ({ username, password }, thunkAPI) => {
  try {
    const response = await axios.post('/api/auth/login', { username, password });
    safeStorage.setItem('userId', response.data.user.id); // Enregistrer l'ID utilisateur dans localStorage
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

export const registerUser = createAsyncThunk('auth/registerUser', async ({ username, email, password }, thunkAPI) => {
  try {
    const response = await axios.post('/api/auth/register', { username, email, password });
    safeStorage.setItem('userId', response.data.user.id); // Enregistrer l'ID utilisateur dans localStorage
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    loading: false,
    error: null,
    isAuthenticated: false,
  },
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      safeStorage.removeItem('jwtToken');
      safeStorage.removeItem('userId'); // Supprimer l'ID utilisateur de localStorage lors de la déconnexion
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.loading = false;
        state.isAuthenticated = true;
        
        // Persist the JWT so protected endpoints (e.g., units) work after login
        if (action.payload.token) {
          safeStorage.setItem('jwtToken', action.payload.token);
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.loading = false;
        state.isAuthenticated = true;
        
        // Persist the JWT directly after registration
        if (action.payload.token) {
          safeStorage.setItem('jwtToken', action.payload.token);
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
