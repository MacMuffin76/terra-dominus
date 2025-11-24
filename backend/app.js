const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const createApiRouter = require('./api');

const createApp = (container) => {
  const app = express();

  app.use(express.json());
  app.use(cors());

  const apiRouter = createApiRouter(container);
  app.use('/api/v1', apiRouter);

  app.use(errorHandler);

  return app;
};

module.exports = createApp;