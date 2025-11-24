require('dotenv').config();
const { Queue, Worker, QueueScheduler } = require('bullmq');

const queueNames = {
  CONSTRUCTION: 'construction',
  PRODUCTION: 'production',
  COMBAT: 'combat',
};

const connection = {
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
};

const defaultJobOptions = {
  attempts: Number(process.env.BULLMQ_ATTEMPTS || 3),
  backoff: {
    type: 'exponential',
    delay: Number(process.env.BULLMQ_BACKOFF_MS || 5000),
  },
  removeOnComplete: true,
  removeOnFail: false,
};

const queueCache = new Map();
const schedulerCache = new Map();

function ensureScheduler(name) {
  if (schedulerCache.has(name)) return schedulerCache.get(name);

  const scheduler = new QueueScheduler(name, { connection });
  scheduler.waitUntilReady().catch((err) => {
    console.error(`[QueueScheduler] Failed to start for ${name}:`, err);
  });

  schedulerCache.set(name, scheduler);
  return scheduler;
}

function getQueue(name) {
  if (queueCache.has(name)) return queueCache.get(name);

  ensureScheduler(name);
  const queue = new Queue(name, { connection, defaultJobOptions });
  queueCache.set(name, queue);
  return queue;
}

function createWorker(name, processor, options = {}) {
  ensureScheduler(name);
  return new Worker(name, processor, { connection, ...options });
}

function serializeJobData(data) {
  const replacer = (_key, value) => (value instanceof Date ? value.toISOString() : value);
  return JSON.parse(JSON.stringify(data, replacer));
}

module.exports = {
  connection,
  defaultJobOptions,
  queueNames,
  getQueue,
  createWorker,
  serializeJobData,
};