const { BlueprintCrafting: Blueprint } = require('../models');
const BlueprintAudit = require('../models/BlueprintAudit');
const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'BlueprintRepository' });

const isMissingTableError = (error) => error?.original?.code === '42P01';

class BlueprintRepository {
  async listByCategory(category) {
    try {
      if (category) {
        return await Blueprint.findAll({ where: { category }, order: [['name', 'ASC']] });
      }
      return await Blueprint.findAll({ order: [['category', 'ASC'], ['name', 'ASC']] });
    } catch (error) {
      if (isMissingTableError(error)) {
        logger.warn({ err: error }, 'Blueprints table missing, returning empty list');
        return [];
      }
      throw error;
    }
  }

  async findByCategoryAndType(category, type) {
    try {
      // Note: 'type' parameter kept for API compatibility but not used as column
      return await Blueprint.findOne({ where: { category }, order: [['name', 'ASC']] });
    } catch (error) {
      if (isMissingTableError(error)) {
        logger.warn({ err: error }, 'Blueprints table missing, returning null');
        return null;
      }
      throw error;
    }
  }

  async findById(id) {
    try {
      return await Blueprint.findByPk(id);
    } catch (error) {
      if (isMissingTableError(error)) {
        logger.warn({ err: error }, 'Blueprints table missing, returning null');
        return null;
      }
      throw error;
    }
  }

  async updateBlueprint(id, updates, userId) {
    try {
      const blueprint = await Blueprint.findByPk(id);
      if (!blueprint) return null;

      const before = {
        max_level: blueprint.max_level,
        base_duration_seconds: blueprint.base_duration_seconds,
        costs: blueprint.costs,
      };

      if (updates.max_level !== undefined) {
        blueprint.max_level = updates.max_level;
      }
      if (updates.base_duration_seconds !== undefined) {
        blueprint.base_duration_seconds = updates.base_duration_seconds;
      }
      if (updates.costs !== undefined) {
        blueprint.costs = updates.costs;
      }

      await blueprint.save();

      const after = {
        max_level: blueprint.max_level,
        base_duration_seconds: blueprint.base_duration_seconds,
        costs: blueprint.costs,
      };

      await BlueprintAudit.create({
        blueprint_id: blueprint.id,
        user_id: userId || null,
        before,
        after,
      });

      return blueprint;
    } catch (error) {
      if (isMissingTableError(error)) {
        logger.warn({ err: error }, 'Blueprints table missing, skipping update');
        return null;
      }
      throw error;
    }
  }
}

module.exports = BlueprintRepository;