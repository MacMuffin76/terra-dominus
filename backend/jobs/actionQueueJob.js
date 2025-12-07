const ActionQueue = require('../models/ActionQueue');
const Research = require('../models/Research');
const Training = require('../models/Training');
const Defense = require('../models/Defense');
const sequelize = require('../db');
const { Op } = require('sequelize');
const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'ActionQueueJob' });

async function processActionQueue() {
  const transaction = await sequelize.transaction();
  try {
    // Find the next in_progress or queued action ordered by startTime
    const nextAction = await ActionQueue.findOne({
      where: {
        status: {
          [Op.in]: ['queued', 'in_progress'],
        },
      },
      order: [['startTime', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE,
      skipLocked: true,
    });

    if (!nextAction) {
      await transaction.commit();
      return;
    }

    const now = new Date();

    if (nextAction.status === 'queued' && nextAction.startTime <= now) {
      // Start the action
      nextAction.status = 'in_progress';
      await nextAction.save({ transaction });
      await transaction.commit();
      return;
    }

    if (nextAction.status === 'in_progress' && nextAction.finishTime <= now) {
      // Complete the action
      switch (nextAction.type) {
        case 'research':
          await completeResearch(nextAction, transaction);
          break;
        case 'training':
          await completeTraining(nextAction, transaction);
          break;
        case 'defense':
          await completeDefense(nextAction, transaction);
          break;
        default:
          logger.error(`Unknown action type: ${nextAction.type}`);
      }
      nextAction.status = 'completed';
      await nextAction.save({ transaction });
      await transaction.commit();
      return;
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    logger.error('Error processing action queue:', error);
  }
}

async function completeResearch(action, transaction) {
  const research = await Research.findByPk(action.entityId, { transaction, lock: transaction.LOCK.UPDATE });
  if (!research) {
    logger.error(`Research not found for action id ${action.id}`);
    return;
  }
  research.level += 1;
  await research.save({ transaction });
  // Additional logic: update leaderboards, achievements, etc. can be called here
}

async function completeTraining(action, transaction) {
  const training = await Training.findByPk(action.entityId, { transaction, lock: transaction.LOCK.UPDATE });
  if (!training) {
    logger.error(`Training not found for action id ${action.id}`);
    return;
  }
  training.level += 1;
  await training.save({ transaction });
  // Additional logic if needed
}

async function completeDefense(action, transaction) {
  const defense = await Defense.findByPk(action.entityId, { transaction, lock: transaction.LOCK.UPDATE });
  if (!defense) {
    logger.error(`Defense not found for action id ${action.id}`);
    return;
  }
  defense.quantity += 1;
  await defense.save({ transaction });
  // Additional logic if needed
}

module.exports = {
  processActionQueue,
};
