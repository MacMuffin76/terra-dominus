const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');
const validate = require('./middleware/validate');
const correlationMiddleware = require('./middleware/correlationMiddleware');
const requestLogger = require('./middleware/requestLogger');
const createApiRouter = require('./api');
const { buildCorsOptions } = require('./utils/cors');

const createApp = (container) => {
  const app = express();

  app.use(express.json());
  app.use(cors(buildCorsOptions()));
  app.use(correlationMiddleware);
  app.use(requestLogger);

  const apiLimiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX || 100),
    standardHeaders: true,
    legacyHeaders: false,
  });

  const apiRouter = createApiRouter(container);
  app.use('/api/v1', apiLimiter, apiRouter);

  app.use(validate.validationErrorHandler);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;