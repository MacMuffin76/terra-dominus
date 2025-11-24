// frontend/src/App.js

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchResources } from './redux/resourceSlice';
import { loginSuccess } from './redux/authSlice';
import axiosInstance from './utils/axiosInstance';
import Dashboard from './components/Dashboard';
import Resources from './components/Resources';
import Facilities from './components/Facilities';
import Research from './components/Research';
import Training from './components/Training';
import Defense from './components/Defense';
import Fleet from './components/Fleet';
import Alliance from './components/Alliance';
import Login from './components/Login';
import Register from './components/Register';
import WebSocketComponent from './components/WebSocketComponent';
import { ResourcesProvider } from './context/ResourcesContext'; // <-- Ajouté ici
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      dispatch(fetchResources(userId));

      axiosInstance.get(`/api/auth/user/${userId}`).then(response => {
        dispatch(loginSuccess(response.data.user));
      }).catch(error => {
        console.error('Failed to fetch user data:', error);
      });
    }
  }, [dispatch]);

  return (
    <ResourcesProvider>
      <Router>
        <div className="App">
          <WebSocketComponent />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={(
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              )}
            />
            <Route
              path="/resources"
              element={(
                <PrivateRoute>
                  <Resources />
                </PrivateRoute>
              )}
            />
            <Route
              path="/facilities"
              element={(
                <PrivateRoute>
                  <Facilities />
                </PrivateRoute>
              )}
            />
            <Route
              path="/research"
              element={(
                <PrivateRoute>
                  <Research />
                </PrivateRoute>
              )}
            />
            <Route
              path="/training"
              element={(
                <PrivateRoute>
                  <Training />
                </PrivateRoute>
              )}
            />
            <Route
              path="/defense"
              element={(
                <PrivateRoute>
                  <Defense />
                </PrivateRoute>
              )}
            />
            <Route
              path="/fleet"
              element={(
                <PrivateRoute>
                  <Fleet />
                </PrivateRoute>
              )}
            />
            <Route
              path="/alliance"
              element={(
                <PrivateRoute>
                  <Alliance />
                </PrivateRoute>
              )}
            />
            <Route path="/" element={<Login />} />
          </Routes>
        </div>
      </Router>
    </ResourcesProvider>

  );
}

export default App;