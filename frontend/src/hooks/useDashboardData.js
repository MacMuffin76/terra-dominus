import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import axiosInstance from '../utils/axiosInstance';
import { fetchDashboardData } from '../redux/dashboardSlice';
import { fetchResources, updateResources } from '../redux/resourceSlice';
import { loginSuccess } from '../redux/authSlice';
import { safeStorage } from '../utils/safeStorage';

const socketUrl = process.env.REACT_APP_SOCKET_URL || window.location.origin;

let socketClient = null;
let listenersCount = 0;

const useDashboardData = () => {
  const dispatch = useDispatch();
  const dashboard = useSelector((state) => state.dashboard);
  const { resources, error: resourcesError } = useSelector((state) => state.resources);
  const { token, user: authUser } = useSelector((state) => state.auth);

  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(
    'Connexion en cours...'
  );
  const [notifications, setNotifications] = useState([]);
  const [hasBootstrapped, setHasBootstrapped] = useState(false);

  const userId = authUser?.id || safeStorage.getItem('userId');
  const storedToken = token || safeStorage.getItem('jwtToken');

  const loadUser = useCallback(async () => {
    try {
      // Utilise la route correcte du backend : /auth/me
      const response = await axiosInstance.get('/auth/me');
      dispatch(loginSuccess(response.data.user));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Impossible de récupérer les informations de l'utilisateur pour le tableau de bord."
      );
    }
  }, [dispatch]);

  const bootstrapDashboard = useCallback(
    async (force = false) => {
      // Ne charge pas si pas de userId OU pas de token
      if (!userId || !storedToken || (hasBootstrapped && !force)) return;
      setHasBootstrapped(true);

      try {
        await dispatch(fetchDashboardData()).unwrap();
      } catch (err) {
        setError(err.message || 'Le chargement du tableau de bord a échoué.');
      }

      try {
        await dispatch(fetchResources()).unwrap();
      } catch (err) {
        setError(
          err?.message ||
            "Une erreur est survenue lors du chargement des ressources. Veuillez réessayer."
        );
      }

      await loadUser();
    },
    [dispatch, loadUser, userId, storedToken]
  );

  const socket = useMemo(() => {
    if (!storedToken) return null;

    if (!socketClient) {
      socketClient = io(socketUrl, {
        path: '/socket.io', // important pour passer par Nginx
        transports: ['websocket'],
        auth: { token: storedToken },
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    }

    listenersCount += 1;
    return socketClient;
  }, [storedToken]);

  useEffect(() => {
    bootstrapDashboard();

    // Optional: add a polling interval to refresh data every X seconds
    // If you want to stop continuous loading, ensure no polling or repeated calls here
    // const interval = setInterval(() => {
    //   bootstrapDashboard(true);
    // }, 60000); // every 60 seconds

    // return () => clearInterval(interval);
  }, [bootstrapDashboard]);

  useEffect(() => {
    if (!socket) {
      setConnectionStatus('Connexion Socket.io en attente (token manquant)');
      return undefined;
    }

    const handleConnect = () => {
      setConnectionStatus('Connecté au serveur Socket.io');
      socket.emit('user_connected');
    };

    const handleDisconnect = () =>
      setConnectionStatus('Déconnecté du serveur Socket.io');
    const handleConnectError = (err) =>
      setConnectionStatus(`Erreur de connexion : ${err.message}`);
    const handleReconnectAttempt = (attempt) =>
      setConnectionStatus(`Tentative de reconnexion (${attempt})...`);
    const handleReconnect = (attempt) =>
      setConnectionStatus(`Reconnecté après ${attempt} tentative(s)`);

    const handleResources = (payload = []) => dispatch(updateResources(payload));
    const handleNotification = (payload) =>
      setNotifications((prev) => [...prev, payload]);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.io.on('reconnect_attempt', handleReconnectAttempt);
    socket.io.on('reconnect', handleReconnect);
    socket.on('resources', handleResources);
    socket.on('notification', handleNotification);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.io.off('reconnect', handleReconnect);
      socket.off('resources', handleResources);
      socket.off('notification', handleNotification);

      listenersCount -= 1;
      if (listenersCount === 0) {
        socket.disconnect();
        socketClient = null;
      }
    };
  }, [dispatch, socket]);

  const clearError = useCallback(() => setError(null), []);

  const combinedError = error || resourcesError || dashboard.error;
  const loading = dashboard.status === 'loading';
  const dashboardData = {
    user: dashboard.user,
    buildings: dashboard.buildings,
    units: dashboard.units || [],
    facilities: dashboard.facilities || [],
    researches: dashboard.researches || [],
    defenses: dashboard.defenses || [],
  };

  return {
    dashboard: dashboardData,
    resources,
    notifications,
    connectionStatus,
    loading,
    error: combinedError,
    clearError,
    refresh: () => bootstrapDashboard(true),
  };
};

export default useDashboardData;
