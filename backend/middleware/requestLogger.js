const pinoHttp = require('pino-http');
const pino = require('pino');
const { logger, contextStorage } = require('../utils/logger');

const httpLogger = pinoHttp({
  logger,
  serializers: {
    err: pino.stdSerializers.err,
    req: (req) => ({
      method: req.method,
      url: req.url,
      traceId: req.traceId,
      reqId: req.reqId,
      userId: req.user?.id,
    }),
    res: pino.stdSerializers.res,
  },
  customProps: (req) => ({
    traceId: req.traceId,
    reqId: req.reqId,
    userId: req.user?.id,
  }),
  customLogLevel: (req, res, err) => {
    if (err) return 'error';
    if (res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
});

const requestLogger = (req, res, next) => {
  const context = contextStorage.getStore() || {};
  contextStorage.enterWith({ ...context, userId: req.user?.id });
  httpLogger(req, res, next);
};

module.exports = requestLogger;