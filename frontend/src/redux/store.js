import { configureStore } from '@reduxjs/toolkit';
import resourceReducer from './resourceSlice';
import authReducer from './authSlice';

const store = configureStore({
  reducer: {
    resources: resourceReducer,
    auth: authReducer,
  },
});

export default store;
