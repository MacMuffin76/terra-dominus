const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const userRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const researchRoutes = require('./routes/researchRoutes');
const trainingRoutes = require('./routes/trainingRoutes');
const defenseRoutes = require('./routes/defenseRoutes');
const unitRoutes = require('./routes/unitRoutes');
const buildingRoutes = require('./routes/buildingRoutes');

const app = express();

app.use(express.json());
app.use(cors());

app.use('/api/auth', userRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api', dashboardRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/defense', defenseRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api', unitRoutes);

app.use(errorHandler);

module.exports = app;