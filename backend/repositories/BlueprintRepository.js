const Blueprint = require('../models/Blueprint');
const BlueprintAudit = require('../models/BlueprintAudit');

class BlueprintRepository {
  async listByCategory(category) {
    if (category) {
      return Blueprint.findAll({ where: { category }, order: [['type', 'ASC']] });
    }
    return Blueprint.findAll({ order: [['category', 'ASC'], ['type', 'ASC']] });
  }

  async findByCategoryAndType(category, type) {
    return Blueprint.findOne({ where: { category, type } });
  }

  async findById(id) {
    return Blueprint.findByPk(id);
  }

  async updateBlueprint(id, updates, userId) {
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
  }
}

module.exports = BlueprintRepository;