const { randomUUID } = require('crypto');
const { runWithContext, getLogger, generateTraceId } = require('../utils/logger');

const correlationMiddleware = (req, res, next) => {
  const incomingTraceId = req.headers['x-trace-id'] || req.headers['x-request-id'];
  const traceId = generateTraceId(incomingTraceId);
  const reqId = randomUUID();

  const context = { traceId, reqId, userId: req.user?.id };

  res.setHeader('x-trace-id', traceId);
  res.setHeader('x-request-id', reqId);

  runWithContext(context, () => {
    req.traceId = traceId;
    req.reqId = reqId;
    req.logger = getLogger({ traceId, reqId });
    next();
  });
};

module.exports = correlationMiddleware;