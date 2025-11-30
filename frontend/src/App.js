// frontend/src/App.js

import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Alert } from './components/ui';
import { ResourcesProvider } from './context/ResourcesContext';
import { TutorialProvider } from './context/TutorialContext';
import PrivateRoute from './components/PrivateRoute';
import './App.css';
import useDashboardData from './hooks/useDashboardData';
import { API_ERROR_EVENT_NAME } from './utils/apiErrorHandler';
import Loader from './components/ui/Loader';

const Dashboard = React.lazy(() => import('./components/Dashboard'));
const Resources = React.lazy(() => import('./components/Resources'));
const Facilities = React.lazy(() => import('./components/Facilities'));
const Research = React.lazy(() => import('./components/Research'));
const Training = React.lazy(() => import('./components/Training'));
const UnitTraining = React.lazy(() => import('./components/units/UnitTrainingPanel'));
const Defense = React.lazy(() => import('./components/Defense'));
const Fleet = React.lazy(() => import('./components/Fleet'));
const Alliance = React.lazy(() => import('./components/Alliance'));
const TradePanel = React.lazy(() => import('./components/TradePanel'));
const Market = React.lazy(() => import('./components/Market'));
const CitySpecialization = React.lazy(() => import('./components/CitySpecialization'));
const WorldMap = React.lazy(() => import('./components/WorldMap'));
const Login = React.lazy(() => import('./components/Login'));
const Register = React.lazy(() => import('./components/Register'));
const Home = React.lazy(() => import('./pages/Home'));
const DesignSystemTest = React.lazy(() => import('./pages/DesignSystemTest'));
const Portals = React.lazy(() => import('./pages/Portals'));

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
    <TutorialProvider>
      <ResourcesProvider>
        <Router>
          <div className="App">
            <Suspense fallback={<Loader label="Chargement de la page..." center size="lg" />}>
              <Routes>
              <Route path="/design-system-test" element={<DesignSystemTest />} />
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
                path="/units"
                element={(
                  <PrivateRoute>
                    <UnitTraining />
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
                path="/trade"
                element={(
                  <PrivateRoute>
                    <TradePanel />
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
              <Route
                path="/market"
                element={(
                  <PrivateRoute>
                    <Market />
                  </PrivateRoute>
                )}
              />
              <Route
                path="/cities"
                element={(
                  <PrivateRoute>
                    <CitySpecialization />
                  </PrivateRoute>
                )}
              />
              <Route
                path="/world"
                element={(
                  <PrivateRoute>
                    <WorldMap />
                  </PrivateRoute>
                )}
              />
              <Route
                path="/portals"
                element={(
                  <PrivateRoute>
                    <Portals />
                  </PrivateRoute>
                )}
              />
              <Route path="/" element={<Home />} />
            </Routes>
          </Suspense>
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
    </TutorialProvider>
  );
}

export default App;