/**
 * PvP Balancing Rules - Attack Cost Scaling & Matchmaking
 * Ensures fair PvP by penalizing attacks on weaker players
 */

const PVP_BALANCING_CONFIG = {
  // Cost scaling (attacking much weaker players costs more)
  WEAK_TARGET_PENALTY: {
    ENABLED: true,
    POWER_THRESHOLD: 0.5,        // Defender < 50% attacker power = weak target
    COST_MULTIPLIER: 2.0,         // 2x resource cost for attacking weak targets
    GOLD_PENALTY: 5000,           // Additional 5000 gold cost
  },

  // Matchmaking power level recommendations
  MATCHMAKING: {
    ENABLED: true,
    OPTIMAL_POWER_RANGE: 0.3,    // ±30% power level = fair match
    FAIR_RANGE: 0.5,              // ±50% power level = acceptable
    UNFAIR_THRESHOLD: 0.7,        // >70% difference = very unfair
  },

  // Rewards scaling (less rewards for attacking weak targets)
  REWARD_SCALING: {
    WEAK_TARGET_MULTIPLIER: 0.5,  // 50% rewards for weak targets
    STRONG_TARGET_MULTIPLIER: 1.5, // 150% rewards for strong targets
  },
};

/**
 * Calculate player power based on cities, units, resources
 * @param {Object} player - Player data
 * @param {Array} cities - Player's cities
 * @param {Object} totalUnits - Total units owned
 * @param {Object} totalResources - Total resources
 * @returns {number} - Power score
 */
function calculatePlayerPower(player, cities = [], totalUnits = {}, totalResources = {}) {
  let power = 0;

  // City count (1000 points per city)
  power += cities.length * 1000;

  // Building levels in cities
  cities.forEach(city => {
    if (city.metal_mine_level) power += city.metal_mine_level * 50;
    if (city.gold_mine_level) power += city.gold_mine_level * 50;
    if (city.fuel_depot_level) power += city.fuel_depot_level * 50;
    if (city.barracks_level) power += city.barracks_level * 100;
    if (city.factory_level) power += city.factory_level * 100;
    if (city.research_lab_level) power += city.research_lab_level * 150;
  });

  // Units (weighted by combat strength)
  const unitPowerValues = {
    infantry: 10,
    cavalry: 25,
    archers: 15,
    siege: 50,
    tanks: 80,
    artillery: 60,
    mechs: 150,
    eliteSoldiers: 40,
  };

  Object.entries(totalUnits).forEach(([unitType, count]) => {
    const unitPower = unitPowerValues[unitType] || 10;
    power += count * unitPower;
  });

  // Resources (less weight, but still counts)
  if (totalResources.gold) power += totalResources.gold * 0.05;
  if (totalResources.metal) power += totalResources.metal * 0.03;
  if (totalResources.fuel) power += totalResources.fuel * 0.02;

  return Math.floor(power);
}

/**
 * Calculate attack cost modifier based on target strength
 * @param {number} attackerPower - Attacker's total power
 * @param {number} defenderPower - Defender's total power
 * @returns {Object} - Cost modifier and details
 */
function calculateAttackCostModifier(attackerPower, defenderPower) {
  if (!PVP_BALANCING_CONFIG.WEAK_TARGET_PENALTY.ENABLED) {
    return {
      costMultiplier: 1.0,
      goldPenalty: 0,
      isWeakTarget: false,
      powerRatio: defenderPower / attackerPower,
      message: null,
    };
  }

  const powerRatio = defenderPower / attackerPower;
  const threshold = PVP_BALANCING_CONFIG.WEAK_TARGET_PENALTY.POWER_THRESHOLD;

  // Defender is much weaker
  if (powerRatio < threshold) {
    return {
      costMultiplier: PVP_BALANCING_CONFIG.WEAK_TARGET_PENALTY.COST_MULTIPLIER,
      goldPenalty: PVP_BALANCING_CONFIG.WEAK_TARGET_PENALTY.GOLD_PENALTY,
      isWeakTarget: true,
      powerRatio: powerRatio.toFixed(2),
      message: `Attacking a weaker player (${(powerRatio * 100).toFixed(0)}% your power). Attack costs x2 and requires ${PVP_BALANCING_CONFIG.WEAK_TARGET_PENALTY.GOLD_PENALTY} gold.`,
    };
  }

  return {
    costMultiplier: 1.0,
    goldPenalty: 0,
    isWeakTarget: false,
    powerRatio: powerRatio.toFixed(2),
    message: null,
  };
}

/**
 * Calculate reward modifier based on target strength
 * @param {number} attackerPower - Attacker's power
 * @param {number} defenderPower - Defender's power
 * @returns {Object} - Reward multiplier and details
 */
function calculateRewardModifier(attackerPower, defenderPower) {
  const powerRatio = defenderPower / attackerPower;
  const weakThreshold = PVP_BALANCING_CONFIG.WEAK_TARGET_PENALTY.POWER_THRESHOLD;

  // Weak target = reduced rewards
  if (powerRatio < weakThreshold) {
    return {
      rewardMultiplier: PVP_BALANCING_CONFIG.REWARD_SCALING.WEAK_TARGET_MULTIPLIER,
      message: `Target is weaker. Rewards reduced to ${PVP_BALANCING_CONFIG.REWARD_SCALING.WEAK_TARGET_MULTIPLIER * 100}%.`,
    };
  }

  // Strong target = bonus rewards
  if (powerRatio > 1.2) {
    return {
      rewardMultiplier: PVP_BALANCING_CONFIG.REWARD_SCALING.STRONG_TARGET_MULTIPLIER,
      message: `Target is stronger! Bonus rewards x${PVP_BALANCING_CONFIG.REWARD_SCALING.STRONG_TARGET_MULTIPLIER}.`,
    };
  }

  // Fair match = normal rewards
  return {
    rewardMultiplier: 1.0,
    message: null,
  };
}

/**
 * Get matchmaking fairness classification
 * @param {number} attackerPower - Attacker's power
 * @param {number} defenderPower - Defender's power
 * @returns {Object} - Fairness classification
 */
function getMatchFairness(attackerPower, defenderPower) {
  if (!PVP_BALANCING_CONFIG.MATCHMAKING.ENABLED) {
    return {
      fairness: 'unknown',
      powerDifference: 0,
      message: 'Matchmaking disabled',
    };
  }

  const powerRatio = Math.abs(1 - defenderPower / attackerPower);
  const optimalRange = PVP_BALANCING_CONFIG.MATCHMAKING.OPTIMAL_POWER_RANGE;
  const fairRange = PVP_BALANCING_CONFIG.MATCHMAKING.FAIR_RANGE;
  const unfairThreshold = PVP_BALANCING_CONFIG.MATCHMAKING.UNFAIR_THRESHOLD;

  if (powerRatio <= optimalRange) {
    return {
      fairness: 'optimal',
      powerDifference: (powerRatio * 100).toFixed(1) + '%',
      message: '✅ Optimal match! Power levels very close.',
      color: '#00FF00',
    };
  }

  if (powerRatio <= fairRange) {
    return {
      fairness: 'fair',
      powerDifference: (powerRatio * 100).toFixed(1) + '%',
      message: '⚖️ Fair match. Power levels reasonably balanced.',
      color: '#FFD700',
    };
  }

  if (powerRatio <= unfairThreshold) {
    return {
      fairness: 'unfair',
      powerDifference: (powerRatio * 100).toFixed(1) + '%',
      message: '⚠️ Unfair match. Significant power difference.',
      color: '#FFA500',
    };
  }

  return {
    fairness: 'very_unfair',
    powerDifference: (powerRatio * 100).toFixed(1) + '%',
    message: '❌ Very unfair match! Large power gap.',
    color: '#FF0000',
  };
}

/**
 * Suggest target players based on matchmaking power level
 * @param {number} attackerPower - Attacker's power
 * @param {Array} potentialTargets - Array of potential target players with power
 * @returns {Array} - Sorted targets by fairness
 */
function suggestTargets(attackerPower, potentialTargets) {
  if (!PVP_BALANCING_CONFIG.MATCHMAKING.ENABLED) {
    return potentialTargets;
  }

  const optimalRange = PVP_BALANCING_CONFIG.MATCHMAKING.OPTIMAL_POWER_RANGE;
  const fairRange = PVP_BALANCING_CONFIG.MATCHMAKING.FAIR_RANGE;

  // Calculate fairness for each target
  const targetsWithFairness = potentialTargets.map(target => {
    const powerRatio = Math.abs(1 - target.power / attackerPower);
    const fairness = getMatchFairness(attackerPower, target.power);

    // Score: Lower is better (0 = perfect match)
    let score = powerRatio;
    if (powerRatio <= optimalRange) score *= 0.5; // Boost optimal matches
    if (powerRatio <= fairRange) score *= 0.8;    // Boost fair matches

    return {
      ...target,
      fairness: fairness.fairness,
      fairnessMessage: fairness.message,
      powerDifference: fairness.powerDifference,
      score,
    };
  });

  // Sort by fairness score (best matches first)
  targetsWithFairness.sort((a, b) => a.score - b.score);

  return targetsWithFairness;
}

/**
 * Apply cost scaling to attack resources
 * @param {Object} attackResources - Resources required for attack
 * @param {Object} costModifier - Cost modifier from calculateAttackCostModifier
 * @returns {Object} - Adjusted resource costs
 */
function applyAttackCostScaling(attackResources, costModifier) {
  const scaledResources = {
    fuel: Math.ceil((attackResources.fuel || 0) * costModifier.costMultiplier),
    food: Math.ceil((attackResources.food || 0) * costModifier.costMultiplier),
    gold: (attackResources.gold || 0) + costModifier.goldPenalty,
  };

  return {
    original: attackResources,
    scaled: scaledResources,
    penalty: {
      fuel: scaledResources.fuel - (attackResources.fuel || 0),
      food: scaledResources.food - (attackResources.food || 0),
      gold: costModifier.goldPenalty,
    },
    message: costModifier.message,
  };
}

/**
 * Apply reward scaling to attack rewards
 * @param {Object} rewards - Base rewards (gold, resources, etc.)
 * @param {Object} rewardModifier - Reward modifier from calculateRewardModifier
 * @returns {Object} - Adjusted rewards
 */
function applyRewardScaling(rewards, rewardModifier) {
  const scaledRewards = {};

  Object.entries(rewards).forEach(([key, value]) => {
    scaledRewards[key] = Math.floor(value * rewardModifier.rewardMultiplier);
  });

  return {
    original: rewards,
    scaled: scaledRewards,
    multiplier: rewardModifier.rewardMultiplier,
    message: rewardModifier.message,
  };
}

module.exports = {
  PVP_BALANCING_CONFIG,
  calculatePlayerPower,
  calculateAttackCostModifier,
  calculateRewardModifier,
  getMatchFairness,
  suggestTargets,
  applyAttackCostScaling,
  applyRewardScaling,
};
