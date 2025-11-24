const { Router } = require('express');
const IORedis = require('ioredis');
const sequelize = require('../db');
const { connection, getQueue, queueNames } = require('../jobs/queueConfig');
const { getLogger } = require('../utils/logger');

const redisClient = new IORedis(connection.url, { maxRetriesPerRequest: 1 });
const logger = getLogger({ module: 'health' });

redisClient.on('error', (err) => {
  logger.error({ err }, 'Redis health client error');
});

const liveness = (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
};

const checkDatabase = async () => {
  await sequelize.authenticate();
};

const checkRedis = async () => {
  await redisClient.ping();
};

const checkQueues = async () => {
  const statuses = {};
  await Promise.all(
    Object.values(queueNames).map(async (queueName) => {
      const queue = getQueue(queueName);
      const counts = await queue.getJobCounts('waiting', 'active', 'delayed', 'failed');
      statuses[queueName] = counts;
    }),
  );
  return statuses;
};

const readiness = async (_req, res) => {
  const response = { status: 'ok', checks: {} };

  try {
    await checkDatabase();
    response.checks.database = 'ok';
  } catch (err) {
    logger.error({ err }, 'Database readiness check failed');
    response.status = 'error';
    response.checks.database = 'error';
  }

  try {
    await checkRedis();
    response.checks.redis = 'ok';
  } catch (err) {
    logger.error({ err }, 'Redis readiness check failed');
    response.status = 'error';
    response.checks.redis = 'error';
  }

  try {
    const queues = await checkQueues();
    response.checks.queues = queues;
  } catch (err) {
    logger.error({ err }, 'Queue readiness check failed');
    response.status = 'error';
    response.checks.queues = 'error';
  }

  const httpStatus = response.status === 'ok' ? 200 : 503;
  res.status(httpStatus).json(response);
};

const createHealthRouter = () => {
  const router = Router();
  router.get('/healthz', liveness);
  router.get('/readyz', readiness);
  return router;
};

module.exports = createHealthRouter;