import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../utils/axiosInstance';
import { logout } from './authSlice';

// Thunk to fetch resources
export const fetchResources = createAsyncThunk('resources/fetchResources', async (userId, thunkAPI) => {
  try {
    const response = await axiosInstance.get(`/resources/${userId}`);
    return response.data || [];
  } catch (error) {
    const status = error.response?.status;

    if (status === 401) {
      thunkAPI.dispatch(logout());
      return thunkAPI.rejectWithValue({ status, message: 'Non autorisé : veuillez vous reconnecter.' });
    }

    const message =
      error.response?.data?.message || error.message || 'Une erreur est survenue lors du chargement des ressources.';
    return thunkAPI.rejectWithValue({ status: status || 500, message });
  }
});

const resourceSlice = createSlice({
  name: 'resources',
  initialState: {
    resources: [],
    loading: false,
    error: null,
  },
  reducers: {
    updateResources(state, action) {
      state.resources = action.payload || [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchResources.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResources.fulfilled, (state, action) => {
        state.resources = action.payload || [];
        state.loading = false;
      })
      .addCase(fetchResources.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error.message;
      });
  },
});

export const { updateResources } = resourceSlice.actions;
export default resourceSlice.reducer;