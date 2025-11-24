// src/components/WebSocketComponent.js
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';

const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const WebSocketComponent = () => {
  const [connectionStatus, setConnectionStatus] = useState('En attente d\'authentification...');
  const [resources, setResources] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const { token: authToken } = useSelector((state) => state.auth);
  const storedToken = authToken || localStorage.getItem('jwtToken');

  const socket = useMemo(() => {
    if (!storedToken) {
      return null;
    }

    return io(socketUrl, {
      transports: ['websocket'],
      auth: { token: storedToken },
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }, [storedToken]);

  useEffect(() => {
    if (!socket) {
      setConnectionStatus('Connexion Socket.io en attente (token manquant)');
      return undefined;
    }

    const handleConnect = () => {
      setConnectionStatus('Connecté au serveur Socket.io');
      socket.emit('user_connected');
    };

    const handleDisconnect = () => setConnectionStatus('Déconnecté du serveur Socket.io');

    const handleConnectError = (error) =>
      setConnectionStatus(`Erreur de connexion : ${error.message}`);

    const handleReconnectAttempt = (attempt) =>
      setConnectionStatus(`Tentative de reconnexion (${attempt})...`);

    const handleReconnect = (attempt) =>
      setConnectionStatus(`Reconnecté après ${attempt} tentative(s)`);

    const handleResources = (payload = []) => setResources(payload);

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
      socket.disconnect();
    };
  }, [socket]);

  return (
    <div>
      <h2>Socket.io</h2>
      <p>{connectionStatus}</p>

      <section>
        <h3>Ressources</h3>
        {resources.length === 0 ? (
          <p>Aucune ressource reçue.</p>
        ) : (
          <ul>
            {resources.map((resource, index) => (
              <li key={index}>
                {resource.type || 'Ressource'} : {resource.amount ?? 'N/A'}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3>Notifications</h3>
        {notifications.length === 0 ? (
          <p>Aucune notification pour le moment.</p>
        ) : (
          <ul>
            {notifications.map((notification, index) => (
              <li key={index}>{JSON.stringify(notification)}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default WebSocketComponent;