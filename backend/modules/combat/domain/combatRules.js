/**
 * Règles de combat territorial avec système de counters
 */

const { getUnitById, calculateCounterMultiplier } = require('./unitDefinitions');

// Types d'attaque
const ATTACK_TYPES = {
  RAID: 'raid',         // Pillage rapide, retrait après combat
  CONQUEST: 'conquest', // Conquête totale (prendre la ville)
  SIEGE: 'siege'        // Siège prolongé (affaiblir défenses)
};

// Vitesse de déplacement des troupes (tiles par heure)
const ARMY_SPEED = 2;

// Calcul du temps de trajet pour une attaque
// speedFactor permet d'appliquer des bonus/malus de formation ou de choix de vitesse (0.5x à 2x)
function calculateTravelTime(distance, speedFactor = 1) {
  const effectiveSpeed = ARMY_SPEED * Math.max(0.1, speedFactor || 1);
  const hours = distance / effectiveSpeed;
  return Math.ceil(hours * 3600); // Secondes
}

// Calcul de la force d'une unité
function calculateUnitStrength(unit) {
  // Si c'est une unit avec force, l'utiliser, sinon défaut
  const baseStrength = unit?.force || unit?.attack_power || 10;
  return baseStrength;
}

// Calcul de la force totale d'une armée
function calculateArmyStrength(waves) {
  return waves.reduce((total, wave) => {
    const unitStrength = calculateUnitStrength(wave.unit || wave.unitEntity);
    return total + (unitStrength * wave.quantity);
  }, 0);
}

/**
 * Calcul de la force d'une armée avec système de counters
 * @param {Array} attackerWaves - Vagues de l'attaquant
 * @param {Array} defenderUnits - Unités du défenseur
 * @returns {{attackerStrength: number, defenderStrength: number, counterBonuses: Object}}
 */
function calculateArmyStrengthWithCounters(attackerWaves, defenderUnits) {
  let attackerStrength = 0;
  let defenderStrength = 0;
  const counterBonuses = {
    attacker: {},
    defender: {}
  };

  // Calculer la composition de chaque armée
  const attackerComposition = {};
  const defenderComposition = {};

  // Map attacker waves
  attackerWaves.forEach(wave => {
    const unit = wave.unit || wave.unitEntity;
    const unitKey = unit?.unit_key || unit?.name?.toLowerCase() || 'militia';
    attackerComposition[unitKey] = (attackerComposition[unitKey] || 0) + wave.quantity;
  });

  // Map defender units
  defenderUnits.forEach(unit => {
    const unitKey = unit.entity?.unit_key || 'militia';
    defenderComposition[unitKey] = (defenderComposition[unitKey] || 0) + unit.quantity;
  });

  // Calculate attacker strength with counter bonuses
  Object.entries(attackerComposition).forEach(([unitKey, quantity]) => {
    const unit = getUnitById(unitKey);
    if (!unit) return;

    let totalMultiplier = 1.0;
    let counterCount = 0;

    // Check against all defender units
    Object.keys(defenderComposition).forEach(defenderUnitKey => {
      const counterMult = calculateCounterMultiplier(unit, getUnitById(defenderUnitKey));
      if (counterMult > 1.0) counterCount++;
      totalMultiplier += (counterMult - 1.0) * 0.3; // Weighted average
    });

    const baseStrength = unit.attack * quantity;
    const finalStrength = baseStrength * totalMultiplier;
    attackerStrength += finalStrength;

    counterBonuses.attacker[unitKey] = {
      multiplier: totalMultiplier,
      counterCount,
      baseStrength,
      finalStrength
    };
  });

  // Calculate defender strength with counter bonuses
  Object.entries(defenderComposition).forEach(([unitKey, quantity]) => {
    const unit = getUnitById(unitKey);
    if (!unit) return;

    let totalMultiplier = 1.0;
    let counterCount = 0;

    // Check against all attacker units
    Object.keys(attackerComposition).forEach(attackerUnitKey => {
      const counterMult = calculateCounterMultiplier(unit, getUnitById(attackerUnitKey));
      if (counterMult > 1.0) counterCount++;
      totalMultiplier += (counterMult - 1.0) * 0.3; // Weighted average
    });

    const baseStrength = unit.defense * quantity;
    const finalStrength = baseStrength * totalMultiplier;
    defenderStrength += finalStrength;

    counterBonuses.defender[unitKey] = {
      multiplier: totalMultiplier,
      counterCount,
      baseStrength,
      finalStrength
    };
  });

  return {
    attackerStrength,
    defenderStrength,
    counterBonuses
  };
}

// Calcul du bonus défensif des murailles - REBALANCED
function calculateWallsBonus(wallLevel) {
  // +8% de défense par niveau de muraille (augmenté de 5%)
  // Maximum 200% bonus (level 25)
  const bonus = wallLevel * 0.08;
  return Math.min(bonus, 2.0);
}

// Calcul du bonus technologique
function calculateTechBonus(researches, techNames) {
  let bonus = 0;
  researches.forEach(research => {
    if (techNames.includes(research.entity.name) && research.level > 0) {
      bonus += research.level * 0.10; // +10% par niveau
    }
  });
  return bonus;
}

// Simuler un combat
// Ajoute un contexte optionnel pour enrichir les logs (formation, bonus de mur, etc.)
function simulateCombat(attackerStrength, defenderStrength, defenderWallsBonus = 0, context = {}) {
  const rounds = [];
  let attStrength = attackerStrength;
  let defStrength = defenderStrength * (1 + defenderWallsBonus);
  let roundCount = 0;

  const { formation = null, formationMultipliers = null } = context || {};

  while (attStrength > 0 && defStrength > 0 && roundCount < 10) {
    roundCount++;

    const attackerStrengthBefore = attStrength;
    const defenderStrengthBefore = defStrength;
    
    // Chaque round, les deux camps s'infligent des dégâts
    const attackerDamage = attStrength * 0.3;
    const defenderDamage = defStrength * 0.3;

    defStrength -= attackerDamage;
    attStrength -= defenderDamage;

    const roundData = {
      round: roundCount,
      // Valeurs "post-round" (compatibilité avec l'ancien schéma)
      attacker_strength: Math.max(0, attStrength),
      defender_strength: Math.max(0, defStrength),
      attacker_damage: attackerDamage,
      defender_damage: defenderDamage,
      // Contexte enrichi pour replays AAA-lite
      attacker_strength_before: Math.max(0, attackerStrengthBefore),
      defender_strength_before: Math.max(0, defenderStrengthBefore),
      defender_walls_bonus: defenderWallsBonus,
      formation,
      formation_multipliers: formationMultipliers || null
    };

    rounds.push(roundData);

    if (attStrength <= 0 || defStrength <= 0) break;
  }

  // Déterminer le vainqueur
  let outcome;
  if (attStrength > defStrength) {
    outcome = 'attacker_victory';
  } else if (defStrength > attStrength) {
    outcome = 'defender_victory';
  } else {
    outcome = 'draw';
  }

  return {
    rounds,
    outcome,
    finalAttackerStrength: Math.max(0, attStrength),
    finalDefenderStrength: Math.max(0, defStrength)
  };
}

// Calculer les pertes d'unités
function calculateLosses(waves, strengthLost, totalStrength) {
  const lossRate = strengthLost / totalStrength;
  const losses = {};

  waves.forEach(wave => {
    const unitLosses = Math.floor(wave.quantity * lossRate);
    losses[wave.unit_entity_id] = unitLosses;
    wave.survivors = wave.quantity - unitLosses;
  });

  return losses;
}

// Calculer le butin pillé (pourcentage des ressources disponibles) - REBALANCED
function calculateLoot(defenderResources, attackType) {
  let lootPercentage;
  
  switch (attackType) {
    case ATTACK_TYPES.RAID:
      lootPercentage = 0.20; // 20% des ressources (réduit de 30%)
      break;
    case ATTACK_TYPES.CONQUEST:
      lootPercentage = 0.40; // 40% des ressources (réduit de 50%)
      break;
    case ATTACK_TYPES.SIEGE:
      lootPercentage = 0.10; // 10% (réduit de 20%)
      break;
    default:
      lootPercentage = 0.10;
  }

  return {
    gold: Math.floor(defenderResources.gold * lootPercentage),
    metal: Math.floor(defenderResources.metal * lootPercentage),
    fuel: Math.floor(defenderResources.fuel * lootPercentage)
  };
}

// Espionnage - dégradation de la précision du rapport dans le temps
function calculateIntelDecay(successRate, arrivalTime, now = new Date()) {
  if (!successRate || !arrivalTime) {
    return {
      effectiveSuccessRate: successRate || 0,
      ageHours: 0,
      decaySteps: 0,
      isStale: false
    };
  }

  const arrival = arrivalTime instanceof Date ? arrivalTime : new Date(arrivalTime);
  const ageMs = now.getTime() - arrival.getTime();
  const ageHours = Math.max(0, ageMs / 3600000);
  const decaySteps = Math.floor(ageHours / 6); // -20% toutes les 6h
  const decayFactor = Math.max(0, 1 - 0.2 * decaySteps);
  const effective = Number((successRate * decayFactor).toFixed(3));
  const isStale = ageHours >= 24; // Après 24h, le rapport est considéré comme périmé

  return {
    effectiveSuccessRate: effective,
    ageHours,
    decaySteps,
    isStale
  };
}

// Espionnage - calcul du taux de succès
function calculateSpySuccessRate(spyCount, targetCounterIntel, missionType) {
  const baseRate = 0.60; // 60% de base
  const spyBonus = Math.min(spyCount * 0.05, 0.30); // +5% par espion (max +30%)
  const counterPenalty = targetCounterIntel * 0.10; // -10% par niveau contre-espionnage

  let typeModifier = 0;
  switch (missionType) {
    case 'reconnaissance':
      typeModifier = 0.20; // +20% (plus facile)
      break;
    case 'military_intel':
      typeModifier = 0;
      break;
    case 'sabotage':
      typeModifier = -0.20; // -20% (plus difficile)
      break;
  }

  const successRate = baseRate + spyBonus - counterPenalty + typeModifier;
  return Math.max(0.10, Math.min(0.95, successRate)); // Entre 10% et 95%
}

// Espionnage - calculer les pertes d'espions
function calculateSpyLosses(spyCount, successRate, detected) {
  if (!detected) return 0;
  
  const baseLossRate = 1 - successRate; // Plus le succès est faible, plus de pertes
  const losses = Math.floor(spyCount * baseLossRate);
  return Math.max(1, losses); // Au moins 1 espion perdu si détecté
}

// Espionnage - déterminer si la mission est détectée
function isSpyMissionDetected(targetCounterIntel) {
  const detectionChance = Math.min(targetCounterIntel * 0.15, 0.60); // Max 60%
  return Math.random() < detectionChance;
}

module.exports = {
  ATTACK_TYPES,
  ARMY_SPEED,
  calculateTravelTime,
  calculateUnitStrength,
  calculateArmyStrength,
  calculateArmyStrengthWithCounters,
  calculateWallsBonus,
  calculateTechBonus,
  simulateCombat,
  calculateLosses,
  calculateLoot,
  calculateSpySuccessRate,
  calculateSpyLosses,
  isSpyMissionDetected,
  calculateIntelDecay
};
