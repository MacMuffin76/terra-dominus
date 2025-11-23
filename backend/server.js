const http = require('http');
const app = require('./app');
const resourceService = require('./services/resourceService');
const { getPgClientConfig } = require('./utils/databaseConfig');
const { initIO } = require('./socket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = initIO(server);

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