require('dotenv').config();
const { Queue, Worker, QueueScheduler } = require('bullmq');
const User = require('../models/User');
const updateResourcesForUser = require('../updateResources');

const connection = {
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
};

const queueName = 'resource-updates';
const interval = Number(process.env.RESOURCE_WORKER_INTERVAL_MS || 60000);

const queue = new Queue(queueName, { connection });
const scheduler = new QueueScheduler(queueName, { connection });

async function ensureRepeatableJob() {
  const repeatableJobs = await queue.getRepeatableJobs();
  const jobExists = repeatableJobs.some((job) => job.id === 'resource-update-interval');

  if (!jobExists) {
    await queue.add(
      'update-resources',
      {},
      {
        jobId: 'resource-update-interval',
        repeat: { every: interval },
        removeOnComplete: true,
        removeOnFail: true,
      }
    );
  }
}

const worker = new Worker(
  queueName,
  async () => {
    const users = await User.findAll({ attributes: ['id'] });
    for (const user of users) {
      await updateResourcesForUser(user.id);
    }
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

async function bootstrap() {
  await scheduler.waitUntilReady();
  await queue.waitUntilReady();
  await ensureRepeatableJob();
  console.log(
    `Resource worker started with interval ${interval}ms using ${connection.url}`
  );
}

bootstrap().catch((err) => {
  console.error('Failed to bootstrap resource worker', err);
  process.exit(1);
});

const shutdown = async () => {
  await worker.close();
  await queue.close();
  await scheduler.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);