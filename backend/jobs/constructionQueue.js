const ConstructionQueue = require('../models/ConstructionQueue');
const { getQueue, queueNames, serializeJobData } = require('./queueConfig');

const constructionQueue = getQueue(queueNames.CONSTRUCTION);

const jobIdForOrder = (orderId) => `${queueNames.CONSTRUCTION}:${orderId}`;

async function removeConstructionJob(orderId) {
  const job = await constructionQueue.getJob(jobIdForOrder(orderId));
  if (job) {
    await job.remove();
  }
}

async function scheduleConstructionCompletion(order, metadata = {}) {
  const payload = serializeJobData({
    orderId: order.id,
    userId: metadata.userId,
  });

  const finishTime = order.finishTime ? new Date(order.finishTime) : null;
  const delay = finishTime ? Math.max(0, finishTime.getTime() - Date.now()) : 0;

  await constructionQueue.add('complete-construction', payload, {
    jobId: jobIdForOrder(order.id),
    delay,
  });
}

async function rescheduleConstructionCompletion(order, metadata = {}) {
  await removeConstructionJob(order.id);
  return scheduleConstructionCompletion(order, metadata);
}

async function scheduleActiveConstruction(cityId, userId) {
  const activeOrder = await ConstructionQueue.findOne({
    where: { cityId, status: 'in_progress' },
    order: [['slot', 'ASC']],
  });

  if (activeOrder) {
    await rescheduleConstructionCompletion(activeOrder, { userId });
  }
}

module.exports = {
  scheduleConstructionCompletion,
  rescheduleConstructionCompletion,
  removeConstructionJob,
  scheduleActiveConstruction,
}; 