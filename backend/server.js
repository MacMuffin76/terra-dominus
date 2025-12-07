const http = require('http');
const createApp = require('./app');
const createContainer = require('./container');
const sequelize = require('./db');
const { initIO } = require('./socket');
const { userConnectedSchema } = require('./validation/socketValidation');
const { startJobs } = require('./jobs');
const { syncConstructionJobs } = require('./jobs/syncConstructionJobs');
const { getLogger, runWithContext, generateTraceId } = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const container = createContainer();
const app = createApp(container);
const server = http.createServer(app);

// Timeouts défensifs pour éviter les requêtes pendantes
server.headersTimeout = Number(process.env.HEADERS_TIMEOUT_MS || 15000);
server.requestTimeout = Number(process.env.REQUEST_TIMEOUT_MS || 15000);

const resourceService = container.resolve('resourceService');
const chatService = container.resolve('chatService');
const logger = getLogger({ module: 'server' });

const emitUserResources = async (socket, userId) => {
  const resources = await resourceService.getUserResources(userId);
  socket.emit('resources', resources);
};

// Chat socket handlers
const registerChatHandlers = require('./modules/chat/socket/chatSocketHandlers');

// Initialize Socket.IO (async to support Redis Adapter)
(async () => {
  const io = await initIO(server);
  startJobs(container);
  
  // Synchroniser les jobs de construction au démarrage
  // Cela reprogramme les constructions in_progress et marque les expirées comme completed
  await syncConstructionJobs();

  io.on('connection', (socket) => {
  const userId = socket.user?.id;

  if (!userId) {
    socket.disconnect(true);
    return;
  }

  const traceId = generateTraceId(socket.handshake.headers['x-trace-id']);
  const context = { traceId, userId, connectionId: socket.id };
  const socketLogger = getLogger({ module: 'socket', userId, connectionId: socket.id, traceId });
  socket.data.logger = socketLogger;
  socket.data.traceId = traceId;

  const userRoom = `user_${userId}`;
  socket.join(userRoom);

  const sendResources = async () =>
    runWithContext(context, async () => {
      try {
        await emitUserResources(socket, userId);
        socketLogger.info('Resources sent to user');
      } catch (error) {
        socketLogger.error({ err: error }, 'Error updating resources');
      }
    });

  runWithContext(context, () => {
    socketLogger.info('Client connected');
    socket.emit('trace_ack', { traceId });
  });

  sendResources();

  // Register chat socket handlers
  registerChatHandlers(io, socket, { chatService });

  socket.on('user_connected', async (payload = {}) => {
    runWithContext(context, async () => {
      const parseResult = userConnectedSchema.safeParse(payload);

      if (!parseResult.success) {
        socket.emit('error', { message: 'Payload invalide pour user_connected' });
        return;
      }

      if (parseResult.data.userId && parseResult.data.userId !== userId) {
        socket.emit('error', { message: 'Accès à une room non autorisée' });
        return;
      }

      await sendResources();
    });
  });

  socket.on('disconnect', () => {
    runWithContext(context, () => {
      socketLogger.info('Client disconnected');
    });
  });

    socket.on('error', (error) => {
      runWithContext(context, () => {
        socketLogger.error({ err: error }, 'WebSocket error');
      });
    });
  });

  server.listen(PORT, () => {
    logger.info({ port: PORT }, 'Server running');
  });
})().catch((error) => {
  logger.error({ err: error }, 'Failed to start server');
  process.exit(1);
});

module.exports = server;