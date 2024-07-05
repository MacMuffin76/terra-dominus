require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Client } = require('pg');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const userRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const researchRoutes = require('./routes/researchRoutes');
const trainingRoutes = require('./routes/trainingRoutes');
const defenseRoutes = require('./routes/defenseRoutes');
const updateResourcesForUser = require('./updateResources');
const cron = require('node-cron'); // Ajoutez ceci
const { updateUserResources } = require('./controllers/resourceController'); // Ajoutez ceci
const User = require('./models/User'); // Ajoutez ceci

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  }
});

const PORT = process.env.PORT || 5000;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});
client.connect();

app.use(express.json());
app.use(cors());

app.use('/api/auth', userRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api', dashboardRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/defense', defenseRoutes);

app.use(errorHandler);

// Planifiez la mise à jour des ressources toutes les secondes
cron.schedule('* * * * * *', async () => {
  const users = await User.findAll();
  for (const user of users) {
    await updateUserResources(user.id);
  }
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
