const ConstructionQueue = require('../models/ConstructionQueue');
const { getQueue, queueNames, serializeJobData } = require('./queueConfig');

const constructionQueue = getQueue(queueNames.CONSTRUCTION);
const resourceUpgradeQueue = getQueue(queueNames.RESOURCE_UPGRADE);
const facilityUpgradeQueue = getQueue(queueNames.FACILITY_UPGRADE);

const jobIdForOrder = (orderId) => `construction-${orderId}`;

async function removeConstructionJob(orderId) {
  const job = await constructionQueue.getJob(jobIdForOrder(orderId));
  if (job) {
    await job.remove();
  }
}

async function scheduleConstructionCompletion(order, metadata = {}) {
  // Déterminer la queue appropriée en fonction du type
  let queue = constructionQueue;
  let queueType = order.type || 'building';
  
  if (queueType === 'facility') {
    queue = facilityUpgradeQueue;
  } else if (queueType === 'building') {
    // Vérifier si c'est un resource building ou un building normal
    // Pour l'instant, on utilise resource-upgrade pour tous les buildings
    queue = resourceUpgradeQueue;
  }

  const payload = serializeJobData({
    queueId: order.id,
    orderId: order.id, // Garder pour compatibilité
    userId: metadata.userId,
  });

  const finishTime = order.finishTime ? new Date(order.finishTime) : null;
  const delay = finishTime ? Math.max(0, finishTime.getTime() - Date.now()) : 0;

  console.log(`[scheduleConstructionCompletion] orderId=${order.id}, type=${queueType}, finishTime=${finishTime}, now=${new Date()}, delay=${delay}ms (${Math.round(delay/1000)}s)`);

  await queue.add('complete-construction', payload, {
    jobId: jobIdForOrder(order.id),
    delay,
  });
  
  console.log(`[scheduleConstructionCompletion] Job added successfully for orderId=${order.id} to ${queueType} queue`);
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