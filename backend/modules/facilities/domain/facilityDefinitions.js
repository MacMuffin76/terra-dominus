/**
 * Facility/Installation Definitions
 * Strategic buildings that unlock capabilities and provide bonuses
 */

const FACILITY_CATEGORIES = {
  MILITARY: 'military',
  TECHNOLOGY: 'technology',
  ECONOMY: 'economy'
};

// Complete facilities roster
const FACILITY_DEFINITIONS = {
  // ============================================
  // BÂTIMENTS MILITAIRES
  // ============================================
  
  TRAINING_CENTER: {
    id: 'training_center',
    name: 'Centre d\'Entraînement',
    description: 'Débloque les unités selon le niveau. Bâtiment militaire principal. Nécessite un Centre de Commandement.',
    category: FACILITY_CATEGORIES.MILITARY,
    icon: '',
    
    maxLevel: 15,
    requiredCommandCenter: 1,
    
    baseCost: {
      gold: 500,
      metal: 300,
      fuel: 100
    },
    
    costMultiplier: 1.5,
    baseBuildTime: 300,
    
    levelUnlocks: {
      1: ['militia', 'riflemen'],
      3: ['scouts', 'transport', 'engineer'],
      5: ['marksmen', 'light_tank'],
      8: ['anti_armor'],
      10: ['heavy_tank']
    },
    
    bonusPerLevel: {
      trainingSpeedBonus: 0.01
    }
  },
  
  DEFENSE_WORKSHOP: {
    id: 'defense_workshop',
    name: 'Atelier de Défense',
    description: 'Construit et améliore les fortifications et tourelles. Nécessite un Centre de Commandement.',
    category: FACILITY_CATEGORIES.MILITARY,
    icon: '',
    
    maxLevel: 15,
    requiredCommandCenter: 1,
    
    baseCost: {
      gold: 600,
      metal: 400,
      fuel: 200
    },
    
    costMultiplier: 1.5,
    baseBuildTime: 360,
    
    levelUnlocks: {
      1: ['reinforced_wall', 'machine_gun_turret'],
      3: ['electric_trap', 'anti_vehicle_turret'],
      5: ['fortified_bunker', 'anti_tank_cannon'],
      8: ['plasma_turret'],
      10: ['energy_shield']
    },
    
    bonusPerLevel: {
      defenseHPBonus: 0.02
    }
  },
  
  // ============================================
  // BÂTIMENTS TECHNOLOGIQUES
  // ============================================
  
  RESEARCH_LAB: {
    id: 'research_lab',
    name: 'Laboratoire de Recherche',
    description: 'Débloque les technologies. Essentiel pour la progression. Nécessite Centre de Commandement niveau 3.',
    category: FACILITY_CATEGORIES.TECHNOLOGY,
    icon: '',
    
    maxLevel: 15,
    requiredCommandCenter: 3,
    
    baseCost: {
      gold: 800,
      metal: 500,
      fuel: 300,
      energy: 100
    },
    
    costMultiplier: 1.6,
    baseBuildTime: 480,
    
    bonusPerLevel: {
      researchSpeedBonus: 0.03
    }
  },
  
  MILITARY_FORGE: {
    id: 'forge',
    name: 'Forge Militaire',
    description: 'Amélioration d\'équipement. Requis pour unités blindées avancées. Nécessite Centre de Commandement niveau 5.',
    category: FACILITY_CATEGORIES.MILITARY,
    icon: '',
    
    maxLevel: 10,
    requiredCommandCenter: 5,
    
    baseCost: {
      gold: 1000,
      metal: 800,
      fuel: 400
    },
    
    costMultiplier: 1.7,
    baseBuildTime: 600,
    
    levelUnlocks: {
      1: ['marksmen'],
      3: ['light_tank'],
      5: ['anti_armor'],
      8: ['heavy_tank']
    },
    
    bonusPerLevel: {
      armorBonus: 0.02,
      armoredAttackBonus: 0.01
    }
  },
  
  // ============================================
  // BÂTIMENTS ÉCONOMIQUES
  // ============================================
  
  COMMAND_CENTER: {
    id: 'command_center',
    name: 'Centre de Commandement',
    description: 'Augmente les capacités globales de votre base. Débloque progressivement toutes les installations.',
    category: FACILITY_CATEGORIES.ECONOMY,
    icon: '',
    
    maxLevel: 10,
    
    baseCost: {
      gold: 2000,
      metal: 1500,
      fuel: 1000
    },
    
    costMultiplier: 2.0,
    baseBuildTime: 900,
    
    levelUnlocks: {
      1: ['training_center_3', 'defense_workshop_3'],
      2: ['training_center_5', 'defense_workshop_5'],
      3: ['research_lab_5'],
      4: ['training_center_8', 'defense_workshop_8'],
      5: ['research_lab_10', 'forge_5'],
      6: ['training_center_10', 'trading_post_5'],
      7: ['defense_workshop_10', 'forge_8'],
      8: ['training_center_15', 'research_lab_15', 'trading_post_10'],
      9: ['defense_workshop_15', 'forge_10'],
      10: ['all_max']
    },
    
    bonusPerLevel: {
      visionBonus: 1,
      constructionSlots: 0.5,
      globalProductionBonus: 0.02
    }
  },
  
  TRADING_POST: {
    id: 'trading_post',
    name: 'Comptoir Commercial',
    description: 'Commerce avec d\'autres joueurs. Réduit les taxes commerciales. Nécessite Centre de Commandement niveau 6.',
    category: FACILITY_CATEGORIES.ECONOMY,
    icon: '',
    
    maxLevel: 10,
    requiredCommandCenter: 6,
    
    baseCost: {
      gold: 1500,
      metal: 800,
      fuel: 500
    },
    
    costMultiplier: 1.5,
    baseBuildTime: 540,
    
    bonusPerLevel: {
      tradeTaxReduction: 0.02,
      tradeCapacityBonus: 0.10
    }
  }
};

// Helper functions
function getFacilityById(facilityId) {
  return FACILITY_DEFINITIONS[facilityId.toUpperCase()];
}

function getFacilityByCategory(category) {
  return Object.values(FACILITY_DEFINITIONS).filter(facility => facility.category === category);
}

function calculateFacilityCost(facility, currentLevel) {
  const nextLevel = currentLevel + 1;
  
  if (nextLevel > facility.maxLevel) {
    return null;
  }
  
  const cost = {};
  for (const [resource, baseAmount] of Object.entries(facility.baseCost)) {
    cost[resource] = Math.floor(baseAmount * Math.pow(facility.costMultiplier, currentLevel));
  }
  
  return cost;
}

function calculateFacilityBuildTime(facility, currentLevel) {
  const nextLevel = currentLevel + 1;
  return Math.floor(facility.baseBuildTime * Math.pow(1.3, currentLevel));
}

function getFacilityBonus(facility, level) {
  const bonuses = {};
  
  for (const [bonusType, bonusPerLevel] of Object.entries(facility.bonusPerLevel || {})) {
    bonuses[bonusType] = bonusPerLevel * level;
  }
  
  return bonuses;
}

function getUnlocksAtLevel(facility, level) {
  return facility.levelUnlocks?.[level] || [];
}

module.exports = {
  FACILITY_DEFINITIONS,
  FACILITY_CATEGORIES,
  getFacilityById,
  getFacilityByCategory,
  calculateFacilityCost,
  calculateFacilityBuildTime,
  getFacilityBonus,
  getUnlocksAtLevel
};