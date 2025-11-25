// frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Snackbar, Alert } from '@mui/material';
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
import { ResourcesProvider } from './context/ResourcesContext';
import PrivateRoute from './components/PrivateRoute';
import './App.css';
import useDashboardData from './hooks/useDashboardData';

function App() {
  const { error, clearError } = useDashboardData();

  return (
    <ResourcesProvider>
      <Router>
        <div className="App">
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
          <Snackbar
            open={Boolean(error)}
            autoHideDuration={6000}
            onClose={clearError}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert severity="error" onClose={clearError} sx={{ width: '100%' }}>
              {error}
            </Alert>
          </Snackbar>
        </div>
      </Router>
    </ResourcesProvider>
  );
}

export default App;