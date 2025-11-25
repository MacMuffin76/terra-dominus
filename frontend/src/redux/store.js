import { configureStore } from '@reduxjs/toolkit';
import resourceReducer from './resourceSlice';
import authReducer from './authSlice';
import dashboardReducer from './dashboardSlice';

const store = configureStore({
  reducer: {
    resources: resourceReducer,
    auth: authReducer,
    dashboard: dashboardReducer,
  },
});

export default store;