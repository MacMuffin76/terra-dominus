// frontend/src/utils/socket.js

import { io } from 'socket.io-client';
import { safeStorage } from './safeStorage';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || window.location.origin;
export const socket = io(SOCKET_URL, {
  path: "/socket.io",
  transports: ["websocket"],
});

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
