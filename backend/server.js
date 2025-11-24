const http = require('http');
const createApp = require('./app');
const createContainer = require('./container');
const sequelize = require('./db');
const { initIO } = require('./socket');
const { userConnectedSchema } = require('./validation/socketValidation');

const PORT = process.env.PORT || 5000;

const container = createContainer();
const app = createApp(container);
const server = http.createServer(app);
const io = initIO(server);

const resourceService = container.resolve('resourceService');

const emitUserResources = async (socket, userId) => {
  const resources = await resourceService.getUserResources(userId);
  socket.emit('resources', resources);
};

io.on('connection', (socket) => {
  const userId = socket.user?.id;

  if (!userId) {
    socket.disconnect(true);
    return;
  }

  const userRoom = `user_${userId}`;
  socket.join(userRoom);

  const sendResources = async () => {
    try {
      await emitUserResources(socket, userId);
      console.log(`Resources sent to user: ${userId}`);
    } catch (error) {
      console.error('Error updating resources:', error);
    }
  };

  sendResources();

  socket.on('user_connected', async (payload = {}) => {
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

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  socket.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = server;