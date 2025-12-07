// frontend/src/App.js

import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Alert } from './components/ui';
import { ResourcesProvider } from './context/ResourcesContext';
import { ResourceProductionProvider } from './context/ResourceProductionContext';
import { TutorialProvider } from './context/TutorialContext';
import PrivateRoute from './components/PrivateRoute';
import './App.css';
import useDashboardData from './hooks/useDashboardData';
import { API_ERROR_EVENT_NAME } from './utils/apiErrorHandler';
import Loader from './components/ui/Loader';
import { ensureConsentInitialized } from './utils/analytics';

const Dashboard = React.lazy(() => import('./components/Dashboard'));
const Resources = React.lazy(() => import('./components/Resources'));
const FacilitiesUnified = React.lazy(() => import('./components/FacilitiesUnified'));
const ResearchUnified = React.lazy(() => import('./components/ResearchUnified'));
const TrainingUnified = React.lazy(() => import('./components/TrainingUnified'));
const DefenseUnified = React.lazy(() => import('./components/DefenseUnified'));
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
const Shop = React.lazy(() => import('./pages/Shop'));
const BattleReports = React.lazy(() => import('./pages/BattleReports'));
const NotificationSettings = React.lazy(() => import('./pages/NotificationSettings'));

function App() {
  const [apiError, setApiError] = useState(null);
  const { error, clearError } = useDashboardData();

  useEffect(() => {
    ensureConsentInitialized();
  }, []);

  useEffect(() => {
    let retries = 0;
    const registerSW = async () => {
      try {
        if ('serviceWorker' in navigator) {
          await navigator.serviceWorker.register('/service-worker.js');
        }
      } catch (err) {
        retries += 1;
        if (retries < 3) {
          setTimeout(registerSW, retries * 1000);
        }
      }
    };

    registerSW();
  }, []);


  useEffect(() => {
    const handleApiError = (event) => setApiError(event.detail);
    window.addEventListener(API_ERROR_EVENT_NAME, handleApiError);
    return () => window.removeEventListener(API_ERROR_EVENT_NAME, handleApiError);
  }, []);

  // Auto-dismiss error après 5 secondes
  useEffect(() => {
    if (apiError || error) {
      const timer = setTimeout(() => {
        setApiError(null);
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [apiError, error, clearError]);

  const combinedError = apiError || error;
  const handleClose = () => {
    clearError();
    setApiError(null);
  };

  return (
    <TutorialProvider>
      <ResourcesProvider>
        <ResourceProductionProvider>
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
                    <FacilitiesUnified />
                  </PrivateRoute>
                )}
              />
              <Route
                path="/research"
                element={(
                  <PrivateRoute>
                    <ResearchUnified />
                  </PrivateRoute>
                )}
              />
              <Route
                path="/training"
                element={(
                  <PrivateRoute>
                    <TrainingUnified />
                  </PrivateRoute>
                )}
              />
              <Route
                path="/units"
                element={(
                  <PrivateRoute>
                    <TrainingUnified />
                  </PrivateRoute>
                )}
              />
              <Route
                path="/defense"
                element={(
                  <PrivateRoute>
                    <DefenseUnified />
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
                path="/shop"
                element={(
                  <PrivateRoute>
                    <Shop />
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
                path="/battle-reports"
                element={(
                  <PrivateRoute>
                    <BattleReports />
                  </PrivateRoute>
                )}
              />
              <Route
                path="/notifications"
                element={(
                  <PrivateRoute>
                    <NotificationSettings />
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
        </ResourceProductionProvider>
    </ResourcesProvider>
    </TutorialProvider>
  );
}

export default App;