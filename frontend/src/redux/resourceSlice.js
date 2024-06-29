import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  metal: 0,
  crystal: 0,
  deuterium: 0,
  energy: 0,
};

const resourceSlice = createSlice({
  name: 'resources',
  initialState,
  reducers: {
    updateResources(state, action) {
      return { ...state, ...action.payload };
    },
  },
});

export const { updateResources } = resourceSlice.actions;
export default resourceSlice.reducer;
