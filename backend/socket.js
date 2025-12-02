const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');
const { getAllowedOrigins } = require('./utils/cors');
const { getJwtSecret } = require('./config/jwtConfig');
const { getLogger } = require('./utils/logger');

let ioInstance = null;
const JWT_SECRET = getJwtSecret();
const logger = getLogger({ module: 'socket' });

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

async function initIO(server) {
  const io = new Server(server, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
    },
  });

  // Redis Adapter pour scaling multi-instances
  if (process.env.REDIS_HOST && process.env.ENABLE_REDIS_ADAPTER === 'true') {
    try {
      const pubClient = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
      });
      
      const subClient = pubClient.duplicate();

      io.adapter(createAdapter(pubClient, subClient));
      logger.info('Redis Adapter enabled for Socket.IO clustering');
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize Redis Adapter, falling back to single instance mode');
    }
  } else {
    logger.info('Redis Adapter disabled (single instance mode)');
  }

  io.use(socketAuthMiddleware);

  ioInstance = io;
  return ioInstance;
}

function getIO() {
  return ioInstance;
}

module.exports = { initIO, getIO };