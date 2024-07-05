import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Thunk to fetch resources
export const fetchResources = createAsyncThunk('resources/fetchResources', async (userId, thunkAPI) => {
  try {
    const response = await axios.get(`/api/resources/${userId}`);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

const resourceSlice = createSlice({
  name: 'resources',
  initialState: {
    resources: {},
    loading: false,
    error: null,
  },
  reducers: {
    updateResources(state, action) {
      state.resources = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchResources.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResources.fulfilled, (state, action) => {
        state.resources = action.payload;
        state.loading = false;
      })
      .addCase(fetchResources.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { updateResources } = resourceSlice.actions;
export default resourceSlice.reducer;
