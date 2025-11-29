const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./docs/swagger');
const errorHandler = require('./middleware/errorHandler');
const validate = require('./middleware/validate');
const correlationMiddleware = require('./middleware/correlationMiddleware');
const requestLogger = require('./middleware/requestLogger');
const createApiRouter = require('./api');
const { buildCorsOptions } = require('./utils/cors');
const { metricsMiddleware, metricsHandler } = require('./observability/metrics');
const createHealthRouter = require('./observability/healthRoutes');

const createApp = (container) => {
  const app = express();

  // Trust the first proxy to ensure rate limiting and client IP detection work
  // correctly when requests include the X-Forwarded-For header.
  app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);

  app.use(express.json());
  app.use(cors(buildCorsOptions()));
  app.use(correlationMiddleware);
  app.use(requestLogger);
  app.use(metricsMiddleware);

  app.get('/metrics', metricsHandler);
  app.use(createHealthRouter());
  
  // Swagger UI - Documentation API interactive
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Terra Dominus API Documentation'
  }));

  const apiLimiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX || 100),
    standardHeaders: true,
    legacyHeaders: false,
  });

  const apiRouter = createApiRouter(container);
  app.use('/api/v1', apiLimiter, apiRouter);

  // --- Ajout : middleware 404 JSON pour toutes les routes non matchées ---
  app.use((req, res, next) => {
    res.status(404).json({
      error: 'Not Found',
      message: 'Route non trouvée',
      path: req.originalUrl,
    });
  });
  // -----------------------------------------------------------------------

  app.use(validate.validationErrorHandler);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;