import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../utils/axiosInstance';

export const fetchDashboardData = createAsyncThunk('dashboard/fetchDashboardData', async () => {
  const response = await axios.get('/dashboard');
  return response.data;
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    user: {},
    resources: [],
    buildings: [],
    units: [],
    messages: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user || {};
        state.resources = action.payload.resources || [];
        state.buildings = action.payload.buildings || [];
        state.units = action.payload.units || [];
        state.messages = action.payload.messages || [];
        state.error = null;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default dashboardSlice.reducer;