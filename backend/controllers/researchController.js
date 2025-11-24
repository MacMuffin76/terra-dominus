const Research = require('../models/Research');
const BlueprintRepository = require('../repositories/BlueprintRepository');
const { getLogger } = require('../utils/logger');

const blueprintRepository = new BlueprintRepository();
const logger = getLogger({ module: 'ResearchController' });

const DEFAULT_RESEARCH_TYPES = [
  'Technologie Laser Photonique',
  'Systèmes d’Armes Railgun',
  'Déploiement de Champs de Force',
  'Guidage Avancé de Missiles',
  'Antigravitationnelle',
  'Ingénierie des Contre-mesures EM',
  'Confinement de Plasma',
  'Impulsion EM Avancée',
  'Nanotechnologie Autoréplicante',
  'Réseau de Détection Quantique',
];

const computeCostBreakdown = (blueprint, level) => {
  if (!blueprint || (blueprint.max_level && level > blueprint.max_level)) {
    return [];
  }

  return Object.entries(blueprint.costs || {}).map(([resource, amount]) => ({
    resource_type: resource,
    amount: Number(amount || 0) * level,
  }));
};

const computeDuration = (blueprint, level) => {
  if (!blueprint || (blueprint.max_level && level > blueprint.max_level)) {
    return null;
  }

  return (blueprint.base_duration_seconds || 0) * level;
};

const sumCost = (costs) => costs.reduce((sum, cost) => sum + Number(cost.amount || 0), 0);

const ensureUserResearches = async (userId) => {
  const researches = await Research.findAll({ where: { user_id: userId } });
  const blueprints = await blueprintRepository.listByCategory('research');
  const expectedTypes = blueprints.length ? blueprints.map((bp) => bp.type) : DEFAULT_RESEARCH_TYPES;

  const missingTypes = expectedTypes.filter(
    (name) => !researches.some((research) => research.name === name)
  );

  if (missingTypes.length > 0) {
    await Research.bulkCreate(
      missingTypes.map((name) => {
        const blueprint = blueprints.find((bp) => bp.type === name);
        const costBreakdown = computeCostBreakdown(blueprint, 1);

        return {
          user_id: userId,
          name,
          level: 0,
          nextlevelcost: sumCost(costBreakdown),
          description: null,
        };
      })
    );

    return Research.findAll({ where: { user_id: userId } });
  }

  return researches;
};

// Get all research items
exports.getResearchItems = async (req, res) => {
  try {
    const researches = await ensureUserResearches(req.user.id);
    const blueprints = await blueprintRepository.listByCategory('research');

    const payload = researches.map((research) => {
      const blueprint = blueprints.find((bp) => bp.type === research.name);
      const nextLevel = Number(research.level || 0) + 1;
      const costBreakdown = computeCostBreakdown(blueprint, nextLevel);

      return {
        ...research.toJSON(),
        nextLevelCost: sumCost(costBreakdown),
        costBreakdown,
        nextLevelDuration: computeDuration(blueprint, nextLevel),
        maxLevel: blueprint?.max_level ?? null,
      };
  });

  res.json(payload);
  } catch (error) {
    (req.logger || logger).error({ err: error }, 'Error fetching research items');
    res.status(500).json({ message: 'Error fetching research items' });
  }
};

// Get details of a specific research item
exports.getResearchDetails = async (req, res) => {
  try {
    const research = await Research.findByPk(req.params.id);
    if (!research) {
      return res.status(404).json({ message: 'Research not found' });
    }
    const blueprint = await blueprintRepository.findByCategoryAndType('research', research.name);
    const nextLevel = Number(research.level || 0) + 1;
    const costBreakdown = computeCostBreakdown(blueprint, nextLevel);
    res.json({
      ...research.dataValues,
      description: research.description,
      nextLevelCost: sumCost(costBreakdown),
      costBreakdown,
      nextLevelDuration: computeDuration(blueprint, nextLevel),
      maxLevel: blueprint?.max_level ?? null,
    });
  } catch (error) {
    (req.logger || logger).error({ err: error }, 'Error fetching research details');
    res.status(500).json({ message: 'Error fetching research details' });
  }
};

// Upgrade a specific research item
exports.upgradeResearch = async (req, res) => {
  try {
    const research = await Research.findByPk(req.params.id);
    if (!research) {
      return res.status(404).json({ message: 'Research not found' });
    }
    const blueprint = await blueprintRepository.findByCategoryAndType('research', research.name);
    if (blueprint?.max_level && research.level >= blueprint.max_level) {
      return res.status(400).json({ message: 'Max level reached for this research' });
    }

    research.level += 1;
    const nextCost = computeCostBreakdown(blueprint, research.level + 1);
    research.nextlevelcost = sumCost(nextCost);
    await research.save();
    (req.logger || logger).audit({ userId: req.user.id, researchId: research.id }, 'Research upgraded');
    res.json({
      ...research.toJSON(),
      nextLevelCost: research.nextlevelcost,
      costBreakdown: nextCost,
      nextLevelDuration: computeDuration(blueprint, research.level + 1),
      maxLevel: blueprint?.max_level ?? null,
    });
  } catch (error) {
    (req.logger || logger).error({ err: error }, 'Error upgrading research');
    res.status(500).json({ message: 'Error upgrading research' });
  }
};

// Destroy a specific research item
exports.destroyResearch = async (req, res) => {
  try {
    const research = await Research.findByPk(req.params.id);
    if (!research) {
      return res.status(404).json({ message: 'Research not found' });
    }
    await research.destroy();
    (req.logger || logger).audit({ userId: req.user.id, researchId: research.id }, 'Research destroyed');
    res.json({ message: 'Research destroyed' });
  } catch (error) {
    (req.logger || logger).error({ err: error }, 'Error destroying research');
    res.status(500).json({ message: 'Error destroying research' });
  }
};