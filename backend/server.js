const http = require('http');
const createApp = require('./app');
const createContainer = require('./container');
const sequelize = require('./db');
const { initIO } = require('./socket');

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
  console.log('Client connected');

  socket.on('user_connected', async ({ userId }) => {
    console.log(`User connected: ${userId}`);
    socket.join(`user_${userId}`);

    try {
      await emitUserResources(socket, userId);
      console.log(`Resources sent to user: ${userId}`);
    } catch (error) {
      console.error('Error updating resources:', error);
    }
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