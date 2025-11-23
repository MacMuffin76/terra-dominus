// frontend/src/utils/socket.js

import { io } from 'socket.io-client';

const socketUrl = process.env.REACT_APP_SOCKET_URL || window.location.origin;
const socket = io(socketUrl);

export const sendUserId = (userId, event) => {
    socket.emit('message', JSON.stringify({ event, userId }));
};

// Envoyer l'ID de l'utilisateur lors de la connexion
socket.on('connect', () => {
    const userId = localStorage.getItem('userId'); // Assurez-vous que l'ID utilisateur est stocké de manière sécurisée
    if (userId) {
        sendUserId(userId, 'user_connected');
    }
});

// Envoyer l'ID de l'utilisateur lors de la déconnexion
window.addEventListener('beforeunload', () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
        sendUserId(userId, 'user_disconnected');
    }
});

// Envoyer l'ID de l'utilisateur lors du changement de page
window.addEventListener('hashchange', () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
        sendUserId(userId, 'page_change');
    }
});

export default socket;
