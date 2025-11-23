const http = require('http');
const { Server } = require('socket.io');
const { Client } = require('pg');
const app = require('./app');
const updateResourcesForUser = require('./updateResources');
const { getPgClientConfig } = require('./utils/databaseConfig');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const client = new Client(getPgClientConfig());
client.connect().catch((error) => {
  console.error('Unable to establish pg client connection:', error.message);
});



const getUserResources = async (userId) => {
  try {
    const res = await client.query('SELECT * FROM resources WHERE user_id = $1', [userId]);
    console.log('Fetched user resources:', res.rows);
    return res.rows;
  } catch (error) {
    console.error('Error fetching user resources:', error);
    return [];
  }
};

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('user_connected', async ({ userId }) => {
    console.log(`User connected: ${userId}`);

    try {
      await updateResourcesForUser(userId);

      const resources = await getUserResources(userId);
      socket.emit('resources', resources);
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