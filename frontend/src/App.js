// frontend/src/App.js

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Alert } from './components/ui';
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
import Home from './pages/Home';
import { ResourcesProvider } from './context/ResourcesContext';
import PrivateRoute from './components/PrivateRoute';
import './App.css';
import useDashboardData from './hooks/useDashboardData';
import { API_ERROR_EVENT_NAME } from './utils/apiErrorHandler';

function App() {
  const [apiError, setApiError] = useState(null);
  const { error, clearError } = useDashboardData();

  useEffect(() => {
    const handleApiError = (event) => setApiError(event.detail);
    window.addEventListener(API_ERROR_EVENT_NAME, handleApiError);
    return () => window.removeEventListener(API_ERROR_EVENT_NAME, handleApiError);
  }, []);

  const combinedError = apiError || error;
  const handleClose = () => {
    clearError();
    setApiError(null);
  };

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
            <Route path="/" element={<Home />} />
          </Routes>
          {combinedError && (
            <div className="app-toast">
              <Alert
                type="error"
                title="Erreur réseau"
                message={combinedError}
                onAction={handleClose}
                actionLabel="Compris"
                onClose={handleClose}
              />
            </div>
          )}
        </div>
      </Router>
    </ResourcesProvider>
  );
}

export default App;