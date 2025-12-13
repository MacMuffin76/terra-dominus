// frontend/src/utils/socket.js

import { io } from 'socket.io-client';
import { safeStorage } from './safeStorage';

// En développement, le backend tourne sur le port 5000
// En production, on utilise le même domaine (reverse proxy)
const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
const SOCKET_URL = isDevelopment ? 'http://localhost:5000' : window.location.origin;

// Récupérer le token JWT pour l'authentification Socket.IO
const getAuthToken = () => {
  return safeStorage.getItem('jwtToken');
};

export const socket = io(SOCKET_URL, {
  path: "/socket.io",
  transports: ["websocket"],
  auth: (cb) => {
    // Fonction callback pour recuperer le token a chaque connexion
    cb({ token: getAuthToken() });
  },
  autoConnect: true,
});

// Fonction pour reconnecter avec un nouveau token
export const reconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
  socket.auth = { token: getAuthToken() };
  socket.connect();
};

export const sendUserId = (userId, event) => {
    socket.emit('message', JSON.stringify({ event, userId }));
};

// Envoyer l'ID de l'utilisateur lors de la connexion
socket.on('connect', () => {
    const userId = safeStorage.getItem('userId'); // Assurez-vous que l'ID utilisateur est stocké de manière sécurisée
    if (userId) {
        sendUserId(userId, 'user_connected');
    }
});

// Envoyer l'ID de l'utilisateur lors de la déconnexion
window.addEventListener('beforeunload', () => {
    const userId = safeStorage.getItem('userId');
    if (userId) {
        sendUserId(userId, 'user_disconnected');
    }
});

// Envoyer l'ID de l'utilisateur lors du changement de page
window.addEventListener('hashchange', () => {
    const userId = safeStorage.getItem('userId');
    if (userId) {
        sendUserId(userId, 'page_change');
    }
});

export default socket;
