import { configureStore } from '@reduxjs/toolkit';
import resourceReducer from './resourceSlice';
import authReducer from './authSlice';
import dashboardReducer from './dashboardSlice';
import chatReducer from './chatSlice';

const store = configureStore({
  reducer: {
    resources: resourceReducer,
    auth: authReducer,
    dashboard: dashboardReducer,
    chat: chatReducer,
  },
});

export default store;