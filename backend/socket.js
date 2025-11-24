const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { getAllowedOrigins } = require('./utils/cors');
const { getJwtSecret } = require('./config/jwtConfig');

let ioInstance = null;
const JWT_SECRET = getJwtSecret();

const parseAuthToken = (socket) => {
  const authHeader = socket.handshake.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return socket.handshake.auth?.token;
};

const allowedNamespaces = (process.env.SOCKET_NAMESPACES || '/').split(',').map((ns) => ns.trim() || '/');

function socketAuthMiddleware(socket, next) {
  if (!allowedNamespaces.includes(socket.nsp.name)) {
    const error = new Error('Namespace non autorisé');
    error.data = { code: 'NAMESPACE_NOT_ALLOWED' };
    return next(error);
  }

  const token = parseAuthToken(socket);
  if (!token) {
    const error = new Error('Token JWT manquant pour Socket.IO');
    error.data = { code: 'AUTH_MISSING' };
    return next(error);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = { id: decoded.id };
    return next();
  } catch (err) {
    const error = new Error('Token JWT invalide');
    error.data = { code: 'AUTH_INVALID' };
    return next(error);
  }
}

function initIO(server) {
  const io = new Server(server, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
    },
  });

  io.use(socketAuthMiddleware);

  ioInstance = io;
  return ioInstance;
}

function getIO() {
  return ioInstance;
}

module.exports = { initIO, getIO };