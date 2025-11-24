const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { AsyncLocalStorage } = require('async_hooks');
const pino = require('pino');

const contextStorage = new AsyncLocalStorage();

const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const resolveLogFilePath = () => {
  const template = process.env.LOG_FILE_TEMPLATE || 'app-%DATE%.log';
  const date = new Date().toISOString().split('T')[0];
  return path.join(logDir, template.replace('%DATE%', date));
};

const fileDestination = pino.destination({ dest: resolveLogFilePath(), mkdir: true, sync: false });

const streams = [{ stream: process.stdout }];

if (process.env.LOG_ENABLE_FILE !== 'false') {
  streams.push({ stream: fileDestination });
}

if (process.env.LOG_EXPORT_PATH) {
  streams.push({ stream: fs.createWriteStream(process.env.LOG_EXPORT_PATH, { flags: 'a' }) });
}

const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    base: { environment: process.env.NODE_ENV || 'development' },
    customLevels: { audit: 35 },
    redact: ['req.headers.authorization', 'req.headers.cookie'],
    serializers: {
      err: pino.stdSerializers.err,
    },
    mixin() {
      const context = contextStorage.getStore();
      if (!context) {
        return {};
      }

      return {
        traceId: context.traceId,
        reqId: context.reqId,
        userId: context.userId,
        connectionId: context.connectionId,
      };
    },
  },
  pino.multistream(streams),
);

const runWithContext = (context, fn) => contextStorage.run(context, fn);

const getLogger = (bindings = {}) => logger.child(bindings);

const generateTraceId = (incomingId) => incomingId || randomUUID();

module.exports = {
  logger,
  getLogger,
  runWithContext,
  contextStorage,
  generateTraceId,
};