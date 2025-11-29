/**
 * Règles de combat territorial
 */

// Types d'attaque
const ATTACK_TYPES = {
  RAID: 'raid',         // Pillage rapide, retrait après combat
  CONQUEST: 'conquest', // Conquête totale (prendre la ville)
  SIEGE: 'siege'        // Siège prolongé (affaiblir défenses)
};

// Vitesse de déplacement des troupes (tiles par heure)
const ARMY_SPEED = 2;

// Calcul du temps de trajet pour une attaque
function calculateTravelTime(distance) {
  const hours = distance / ARMY_SPEED;
  return Math.ceil(hours * 3600); // Secondes
}

// Calcul de la force d'une unité
function calculateUnitStrength(unitEntity) {
  const baseStrength = unitEntity.attack_power || 1;
  return baseStrength;
}

// Calcul de la force totale d'une armée
function calculateArmyStrength(waves) {
  return waves.reduce((total, wave) => {
    const unitStrength = calculateUnitStrength(wave.unitEntity);
    return total + (unitStrength * wave.quantity);
  }, 0);
}

// Calcul du bonus défensif des murailles
function calculateWallsBonus(wallLevel) {
  // +5% de défense par niveau de muraille
  return wallLevel * 0.05;
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
function simulateCombat(attackerStrength, defenderStrength, defenderWallsBonus = 0) {
  const rounds = [];
  let attStrength = attackerStrength;
  let defStrength = defenderStrength * (1 + defenderWallsBonus);
  let roundCount = 0;

  while (attStrength > 0 && defStrength > 0 && roundCount < 10) {
    roundCount++;
    
    // Chaque round, les deux camps s'infligent des dégâts
    const attackerDamage = attStrength * 0.3;
    const defenderDamage = defStrength * 0.3;

    defStrength -= attackerDamage;
    attStrength -= defenderDamage;

    rounds.push({
      round: roundCount,
      attacker_strength: Math.max(0, attStrength),
      defender_strength: Math.max(0, defStrength),
      attacker_damage: attackerDamage,
      defender_damage: defenderDamage
    });

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

  return { rounds, outcome, finalAttackerStrength: Math.max(0, attStrength), finalDefenderStrength: Math.max(0, defStrength) };
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

// Calculer le butin pillé (pourcentage des ressources disponibles)
function calculateLoot(defenderResources, attackType) {
  let lootPercentage;
  
  switch (attackType) {
    case ATTACK_TYPES.RAID:
      lootPercentage = 0.30; // 30% des ressources
      break;
    case ATTACK_TYPES.CONQUEST:
      lootPercentage = 0.50; // 50% des ressources
      break;
    case ATTACK_TYPES.SIEGE:
      lootPercentage = 0.20; // 20% (but affaiblir défenses)
      break;
    default:
      lootPercentage = 0.20;
  }

  return {
    gold: Math.floor(defenderResources.gold * lootPercentage),
    metal: Math.floor(defenderResources.metal * lootPercentage),
    fuel: Math.floor(defenderResources.fuel * lootPercentage)
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
  calculateWallsBonus,
  calculateTechBonus,
  simulateCombat,
  calculateLosses,
  calculateLoot,
  calculateSpySuccessRate,
  calculateSpyLosses,
  isSpyMissionDetected
};
