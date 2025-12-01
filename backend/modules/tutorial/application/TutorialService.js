const { getLogger } = require('../../../utils/logger');
const TutorialProgress = require('../../../models/TutorialProgress');
const tutorialRules = require('../domain/tutorialRules');
const Resource = require('../../../models/Resource');
const Unit = require('../../../models/Unit');
const City = require('../../../models/City');
const User = require('../../../models/User');

const logger = getLogger({ module: 'TutorialService' });

class TutorialService {
  constructor({ sequelize }) {
    this.sequelize = sequelize;
  }

  /**
   * Initialize tutorial for new user
   */
  async initializeTutorial(userId) {
    try {
      const existing = await TutorialProgress.findOne({ where: { user_id: userId } });
      if (existing) {
        return existing;
      }

      const progress = await TutorialProgress.create({
        user_id: userId,
        current_step: 1,
        completed: false,
        skipped: false,
        completed_steps: [],
        started_at: new Date(),
      });

      logger.info({ userId }, 'Tutorial initialized');
      return progress;
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to initialize tutorial');
      throw error;
    }
  }

  /**
   * Get user's tutorial progress
   */
  async getProgress(userId) {
    try {
      let progress = await TutorialProgress.findOne({ where: { user_id: userId } });
      
      if (!progress) {
        progress = await this.initializeTutorial(userId);
      }

      // Auto-complete steps that are already satisfied
      await this.autoCompleteSteps(userId, progress);

      const currentStep = tutorialRules.getStepById(progress.current_step);
      const completionPercentage = tutorialRules.getCompletionPercentage(progress.completed_steps);
      const nextStep = tutorialRules.getNextStep(progress.current_step);

      return {
        progress,
        currentStep,
        nextStep,
        completionPercentage,
        allSteps: tutorialRules.getAllSteps(),
      };
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to get tutorial progress');
      throw error;
    }
  }

  /**
   * Auto-complete tutorial steps that are already satisfied
   */
  async autoCompleteSteps(userId, progress) {
    if (progress.completed || progress.skipped) {
      return;
    }

    const Building = require('../../../models/Building');
    const city = await City.findOne({
      where: { user_id: userId, is_capital: true }
    });

    if (!city) return;

    const allSteps = tutorialRules.getAllSteps();
    let hasChanges = false;

    for (const step of allSteps) {
      // Skip already completed steps
      if (progress.completed_steps.includes(step.id)) {
        continue;
      }

      // Check if step conditions are met
      if (step.action.type === 'complete_action') {
        const { actionKey, actionData } = step.action;

        if (actionKey === 'upgrade_building') {
          const { buildingName, targetLevel } = actionData;
          const building = await Building.findOne({
            where: { city_id: city.id, name: buildingName }
          });

          if (building && building.level >= targetLevel) {
            progress.completed_steps.push(step.id);
            hasChanges = true;
            logger.info({ userId, stepId: step.id, buildingName, level: building.level }, 
              'Auto-completed tutorial step (building already upgraded)');
          }
        }

        if (actionKey === 'train_units') {
          const Unit = require('../../../models/Unit');
          const { unitType, quantity } = actionData;
          const unit = await Unit.findOne({
            where: { city_id: city.id, name: unitType }
          });

          if (unit && unit.quantity >= quantity) {
            progress.completed_steps.push(step.id);
            hasChanges = true;
            logger.info({ userId, stepId: step.id, unitType, quantity: unit.quantity }, 
              'Auto-completed tutorial step (units already trained)');
          }
        }
      }
    }

    if (hasChanges) {
      // Update current step to next incomplete step
      const nextIncompleteStep = allSteps.find(s => !progress.completed_steps.includes(s.id));
      if (nextIncompleteStep) {
        progress.current_step = nextIncompleteStep.id;
      } else {
        progress.completed = true;
        progress.completed_at = new Date();
      }
      await progress.save();
    }
  }

  /**
   * Complete a tutorial step
   */
  async completeStep(userId, stepId, actionData = {}) {
    const transaction = await this.sequelize.transaction();

    try {
      const progress = await TutorialProgress.findOne({ 
        where: { user_id: userId },
        transaction 
      });

      if (!progress) {
        throw new Error('Tutorial progress not found');
      }

      if (progress.completed) {
        throw new Error('Tutorial already completed');
      }

      const step = tutorialRules.getStepById(stepId);
      if (!step) {
        throw new Error(`Step ${stepId} not found`);
      }

      // Validate action if required
      if (step.action.type === 'complete_action') {
        const validation = tutorialRules.validateStepAction(step, actionData);
        if (!validation.valid) {
          throw new Error(validation.reason);
        }
      }

      // Mark step as completed
      const completedSteps = [...progress.completed_steps];
      if (!completedSteps.includes(stepId)) {
        completedSteps.push(stepId);
      }

      // Check if tutorial is complete
      const isComplete = tutorialRules.isTutorialComplete(completedSteps);
      const nextStep = tutorialRules.getNextStep(stepId);

      progress.completed_steps = completedSteps;
      progress.current_step = nextStep ? nextStep.id : stepId;
      progress.completed = isComplete;
      progress.completed_at = isComplete ? new Date() : null;
      await progress.save({ transaction });

      // Grant rewards
      await this.grantStepRewards(userId, step, transaction);

      await transaction.commit();

      logger.info({ userId, stepId }, 'Tutorial step completed');

      return {
        progress,
        stepCompleted: step,
        nextStep,
        tutorialCompleted: isComplete,
      };
    } catch (error) {
      await transaction.rollback();
      logger.error({ err: error, userId, stepId }, 'Failed to complete tutorial step');
      throw error;
    }
  }

  /**
   * Skip tutorial
   */
  async skipTutorial(userId) {
    try {
      const progress = await TutorialProgress.findOne({ where: { user_id: userId } });
      
      if (!progress) {
        throw new Error('Tutorial progress not found');
      }

      if (progress.completed) {
        throw new Error('Tutorial already completed');
      }

      progress.skipped = true;
      progress.completed = true;
      progress.completed_at = new Date();
      await progress.save();

      logger.info({ userId }, 'Tutorial skipped');

      return progress;
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to skip tutorial');
      throw error;
    }
  }

  /**
   * Reset tutorial (for testing or replay)
   */
  async resetTutorial(userId) {
    try {
      const progress = await TutorialProgress.findOne({ where: { user_id: userId } });
      
      if (!progress) {
        return await this.initializeTutorial(userId);
      }

      progress.current_step = 1;
      progress.completed = false;
      progress.skipped = false;
      progress.completed_steps = [];
      progress.started_at = new Date();
      progress.completed_at = null;
      await progress.save();

      logger.info({ userId }, 'Tutorial reset');

      return progress;
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to reset tutorial');
      throw error;
    }
  }

  /**
   * Grant step rewards to user
   */
  async grantStepRewards(userId, step, transaction) {
    if (!step.reward) {
      return;
    }

    const { or, metal, carburant, energie, xp, units } = step.reward;

    // Get user's main city
    const city = await City.findOne({
      where: { user_id: userId, is_capital: true },
      transaction
    });

    if (!city) {
      throw new Error('User city not found');
    }

    // Grant resources
    if (or || metal || carburant || energie) {
      const resources = await Resource.findAll({
        where: { city_id: city.id },
        transaction
      });

      for (const resource of resources) {
        if (or && resource.type === 'or') {
          resource.amount += or;
          await resource.save({ transaction });
        }
        if (metal && resource.type === 'metal') {
          resource.amount += metal;
          await resource.save({ transaction });
        }
        if (carburant && resource.type === 'carburant') {
          resource.amount += carburant;
          await resource.save({ transaction });
        }
        if (energie && resource.type === 'energie') {
          resource.amount += energie;
          await resource.save({ transaction });
        }
      }
    }

    // Grant XP
    if (xp) {
      const user = await User.findByPk(userId, { transaction });
      if (user) {
        user.points_experience = (user.points_experience || 0) + xp;
        await user.save({ transaction });
      }
    }

    // Grant units
    if (units && units.length > 0) {
      for (const unitReward of units) {
        const unit = await Unit.findOne({
          where: { 
            city_id: city.id,
            name: unitReward.type 
          },
          transaction
        });

        if (unit) {
          unit.quantity += unitReward.quantity;
          await unit.save({ transaction });
        }
      }
    }

    logger.info({ userId, stepId: step.id, rewards: step.reward }, 'Tutorial rewards granted');
  }

  /**
   * Get tutorial statistics
   */
  async getStatistics() {
    try {
      const total = await TutorialProgress.count();
      const completed = await TutorialProgress.count({ where: { completed: true, skipped: false } });
      const skipped = await TutorialProgress.count({ where: { skipped: true } });
      const inProgress = await TutorialProgress.count({ where: { completed: false, skipped: false } });

      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      const skipRate = total > 0 ? Math.round((skipped / total) * 100) : 0;

      return {
        total,
        completed,
        skipped,
        inProgress,
        completionRate,
        skipRate,
      };
    } catch (error) {
      logger.error({ err: error }, 'Failed to get tutorial statistics');
      throw error;
    }
  }
}

module.exports = TutorialService;
