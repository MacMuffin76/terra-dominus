/**
 * Research Definitions
 * Technologies that unlock units, improve economy, and enhance capabilities
 */

const RESEARCH_CATEGORIES = {
  ECONOMY: 'economy',
  MILITARY_INFANTRY: 'military_infantry',
  MILITARY_VEHICLES: 'military_vehicles',
  MILITARY_ADVANCED: 'military_advanced',
  DEFENSE: 'defense',
  EXPLORATION: 'exploration'
};

// Complete research tree
const RESEARCH_DEFINITIONS = {
  // ============================================
  // ÉCONOMIE - Améliore la production
  // ============================================
  
  ADVANCED_EXTRACTION_1: {
    id: 'advanced_extraction_1',
    name: 'Extraction Avancée I',
    description: '+10% production or, métal, carburant',
    category: RESEARCH_CATEGORIES.ECONOMY,
    tier: 1,
    
    requiredBuildings: {
      researchLab: 1
    },
    requiredResearch: [],
    
    cost: {
      gold: 500,
      metal: 300,
      fuel: 100
    },
    researchTime: 600,
    
    effects: {
      productionBonus: { gold: 0.10, metal: 0.10, fuel: 0.10 }
    }
  },
  
  ADVANCED_EXTRACTION_2: {
    id: 'advanced_extraction_2',
    name: 'Extraction Avancée II',
    description: '+20% production or, métal, carburant (cumulatif)',
    category: RESEARCH_CATEGORIES.ECONOMY,
    tier: 2,
    
    requiredBuildings: {
      researchLab: 3
    },
    requiredResearch: ['advanced_extraction_1'],
    
    cost: {
      gold: 1200,
      metal: 800,
      fuel: 300
    },
    researchTime: 1200,
    
    effects: {
      productionBonus: { gold: 0.20, metal: 0.20, fuel: 0.20 }
    }
  },
  
  ENERGY_EFFICIENCY_1: {
    id: 'energy_efficiency_1',
    name: 'Efficacité Énergétique I',
    description: 'Réduit consommation d\'énergie de 15%',
    category: RESEARCH_CATEGORIES.ECONOMY,
    tier: 1,
    
    requiredBuildings: {
      researchLab: 1,
      powerPlant: 2
    },
    requiredResearch: [],
    
    cost: {
      gold: 400,
      metal: 200,
      fuel: 150,
      energy: 100
    },
    researchTime: 480,
    
    effects: {
      energyConsumptionReduction: 0.15
    }
  },
  
  LOGISTICS_1: {
    id: 'logistics_1',
    name: 'Logistique I',
    description: '+20% capacité de stockage',
    category: RESEARCH_CATEGORIES.ECONOMY,
    tier: 1,
    
    requiredBuildings: {
      researchLab: 2
    },
    requiredResearch: [],
    
    cost: {
      gold: 600,
      metal: 400,
      fuel: 200
    },
    researchTime: 720,
    
    effects: {
      storageBonus: 0.20
    }
  },
  
  // ============================================
  // MILITAIRE - INFANTERIE
  // ============================================
  
  MILITARY_TRAINING_1: {
    id: 'military_training_1',
    name: 'Formation Militaire I',
    description: 'Débloque Fusiliers. +5% attaque infanterie.',
    category: RESEARCH_CATEGORIES.MILITARY_INFANTRY,
    tier: 1,
    
    requiredBuildings: {
      researchLab: 1,
      trainingCenter: 1
    },
    requiredResearch: [],
    
    cost: {
      gold: 300,
      metal: 200,
      fuel: 0
    },
    researchTime: 300,
    
    effects: {
      unlocks: ['riflemen'],
      infantryAttackBonus: 0.05
    }
  },
  
  MILITARY_TRAINING_2: {
    id: 'military_training_2',
    name: 'Formation Militaire II',
    description: '+10% attaque infanterie (cumulatif)',
    category: RESEARCH_CATEGORIES.MILITARY_INFANTRY,
    tier: 2,
    
    requiredBuildings: {
      researchLab: 3,
      trainingCenter: 3
    },
    requiredResearch: ['military_training_1'],
    
    cost: {
      gold: 800,
      metal: 500,
      fuel: 200
    },
    researchTime: 600,
    
    effects: {
      infantryAttackBonus: 0.10
    }
  },
  
  GUERRILLA_TACTICS_1: {
    id: 'guerrilla_tactics_1',
    name: 'Tactiques de Guérilla I',
    description: 'Débloque Éclaireurs. +15% vitesse infanterie.',
    category: RESEARCH_CATEGORIES.MILITARY_INFANTRY,
    tier: 2,
    
    requiredBuildings: {
      researchLab: 2,
      trainingCenter: 3
    },
    requiredResearch: ['military_training_1'],
    
    cost: {
      gold: 500,
      metal: 300,
      fuel: 200
    },
    researchTime: 420,
    
    effects: {
      unlocks: ['scouts'],
      infantrySpeedBonus: 0.15
    }
  },
  
  AUTOMATIC_WEAPONS: {
    id: 'automatic_weapons',
    name: 'Armes Automatiques',
    description: 'Débloque Tireurs d\'Élite. +15% attaque infanterie.',
    category: RESEARCH_CATEGORIES.MILITARY_INFANTRY,
    tier: 3,
    
    requiredBuildings: {
      researchLab: 5,
      trainingCenter: 5,
      forge: 1
    },
    requiredResearch: ['military_training_2'],
    
    cost: {
      gold: 1500,
      metal: 1000,
      fuel: 500
    },
    researchTime: 900,
    
    effects: {
      unlocks: ['marksmen'],
      infantryAttackBonus: 0.15
    }
  },
  
  // ============================================
  // MILITAIRE - VÉHICULES
  // ============================================
  
  MOTORIZATION_1: {
    id: 'motorization_1',
    name: 'Motorisation I',
    description: 'Débloque Transport Blindé.',
    category: RESEARCH_CATEGORIES.MILITARY_VEHICLES,
    tier: 2,
    
    requiredBuildings: {
      researchLab: 2,
      trainingCenter: 3
    },
    requiredResearch: [],
    
    cost: {
      gold: 600,
      metal: 400,
      fuel: 300
    },
    researchTime: 480,
    
    effects: {
      unlocks: ['transport']
    }
  },
  
  LIGHT_ARMOR: {
    id: 'light_armor',
    name: 'Blindage Léger',
    description: 'Débloque Chars Légers.',
    category: RESEARCH_CATEGORIES.MILITARY_VEHICLES,
    tier: 3,
    
    requiredBuildings: {
      researchLab: 5,
      trainingCenter: 5,
      forge: 3
    },
    requiredResearch: ['motorization_1'],
    
    cost: {
      gold: 2000,
      metal: 1500,
      fuel: 800
    },
    researchTime: 1200,
    
    effects: {
      unlocks: ['light_tank']
    }
  },
  
  HEAVY_ARMOR: {
    id: 'heavy_armor',
    name: 'Blindage Lourd',
    description: 'Débloque Tanks Lourds.',
    category: RESEARCH_CATEGORIES.MILITARY_VEHICLES,
    tier: 4,
    
    requiredBuildings: {
      researchLab: 8,
      trainingCenter: 10,
      forge: 8
    },
    requiredResearch: ['light_armor'],
    
    cost: {
      gold: 5000,
      metal: 4000,
      fuel: 2000
    },
    researchTime: 2400,
    
    effects: {
      unlocks: ['heavy_tank']
    }
  },
  
  ANTI_ARMOR_WEAPONS: {
    id: 'anti_armor_weapons',
    name: 'Armement Anti-Blindage',
    description: 'Débloque Anti-Blindage. +20% dégâts vs véhicules.',
    category: RESEARCH_CATEGORIES.MILITARY_ADVANCED,
    tier: 4,
    
    requiredBuildings: {
      researchLab: 7,
      trainingCenter: 8,
      forge: 5
    },
    requiredResearch: ['automatic_weapons'],
    
    cost: {
      gold: 3000,
      metal: 2500,
      fuel: 1500
    },
    researchTime: 1800,
    
    effects: {
      unlocks: ['anti_armor'],
      antiArmorBonus: 0.20
    }
  },
  
  // ============================================
  // MILITAIRE - AVANCÉ
  // ============================================
  
  ENERGY_WEAPONS: {
    id: 'energy_weapons',
    name: 'Armes à Énergie',
    description: 'Débloque Tourelles Plasma. +10% dégâts énergie.',
    category: RESEARCH_CATEGORIES.MILITARY_ADVANCED,
    tier: 4,
    
    requiredBuildings: {
      researchLab: 8,
      powerPlant: 5
    },
    requiredResearch: ['energy_efficiency_1'],
    
    cost: {
      gold: 4000,
      metal: 3000,
      fuel: 0,
      energy: 2000
    },
    researchTime: 2100,
    
    effects: {
      unlocks: ['plasma_turret'],
      energyDamageBonus: 0.10
    }
  },
  
  SPECIAL_FORCES: {
    id: 'special_forces',
    name: 'Forces Spéciales',
    description: '+25% initiative toutes unités Tier 3+',
    category: RESEARCH_CATEGORIES.MILITARY_ADVANCED,
    tier: 4,
    
    requiredBuildings: {
      researchLab: 10,
      trainingCenter: 10
    },
    requiredResearch: ['automatic_weapons', 'guerrilla_tactics_1'],
    
    cost: {
      gold: 6000,
      metal: 4000,
      fuel: 2000
    },
    researchTime: 3000,
    
    effects: {
      initiativeBonus: 0.25
    }
  },
  
  // ============================================
  // DÉFENSE
  // ============================================
  
  FORTIFICATIONS_1: {
    id: 'fortifications_1',
    name: 'Fortifications I',
    description: '+20% HP murs et bunkers',
    category: RESEARCH_CATEGORIES.DEFENSE,
    tier: 1,
    
    requiredBuildings: {
      researchLab: 1,
      defenseWorkshop: 1
    },
    requiredResearch: [],
    
    cost: {
      gold: 400,
      metal: 300,
      fuel: 0
    },
    researchTime: 360,
    
    effects: {
      fortificationHPBonus: 0.20
    }
  },
  
  FORTIFICATIONS_2: {
    id: 'fortifications_2',
    name: 'Fortifications II',
    description: 'Débloque Bunker. +30% HP murs et bunkers (cumulatif)',
    category: RESEARCH_CATEGORIES.DEFENSE,
    tier: 3,
    
    requiredBuildings: {
      researchLab: 5,
      defenseWorkshop: 5
    },
    requiredResearch: ['fortifications_1'],
    
    cost: {
      gold: 1500,
      metal: 1200,
      fuel: 500
    },
    researchTime: 1200,
    
    effects: {
      unlocks: ['fortified_bunker'],
      fortificationHPBonus: 0.30
    }
  },
  
  TARGETING_SYSTEMS_1: {
    id: 'targeting_systems_1',
    name: 'Systèmes de Ciblage I',
    description: 'Débloque Tourelle Anti-Véhicule. +15% précision tourelles.',
    category: RESEARCH_CATEGORIES.DEFENSE,
    tier: 2,
    
    requiredBuildings: {
      researchLab: 3,
      defenseWorkshop: 3
    },
    requiredResearch: [],
    
    cost: {
      gold: 800,
      metal: 600,
      fuel: 300
    },
    researchTime: 600,
    
    effects: {
      unlocks: ['anti_vehicle_turret'],
      turretAccuracyBonus: 0.15
    }
  },
  
  ENERGY_SHIELDS: {
    id: 'energy_shields',
    name: 'Boucliers Énergétiques',
    description: 'Débloque Bouclier Énergétique. Protection de zone avancée.',
    category: RESEARCH_CATEGORIES.DEFENSE,
    tier: 4,
    
    requiredBuildings: {
      researchLab: 10,
      defenseWorkshop: 10,
      powerPlant: 5
    },
    requiredResearch: ['energy_weapons'],
    
    cost: {
      gold: 8000,
      metal: 5000,
      fuel: 0,
      energy: 3000
    },
    researchTime: 3600,
    
    effects: {
      unlocks: ['energy_shield']
    }
  },
  
  // ============================================
  // EXPLORATION
  // ============================================
  
  CARTOGRAPHY_1: {
    id: 'cartography_1',
    name: 'Cartographie I',
    description: '+2 vision de la carte',
    category: RESEARCH_CATEGORIES.EXPLORATION,
    tier: 1,
    
    requiredBuildings: {
      researchLab: 1
    },
    requiredResearch: [],
    
    cost: {
      gold: 300,
      metal: 100,
      fuel: 100
    },
    researchTime: 240,
    
    effects: {
      visionBonus: 2
    }
  },
  
  RAPID_LOGISTICS: {
    id: 'rapid_logistics',
    name: 'Logistique Rapide',
    description: 'Réduit temps de déplacement des armées de 15%',
    category: RESEARCH_CATEGORIES.EXPLORATION,
    tier: 2,
    
    requiredBuildings: {
      researchLab: 3
    },
    requiredResearch: ['logistics_1'],
    
    cost: {
      gold: 1000,
      metal: 600,
      fuel: 400
    },
    researchTime: 720,
    
    effects: {
      travelTimeReduction: 0.15
    }
  }
};

// Helper functions
function getResearchById(researchId) {
  return RESEARCH_DEFINITIONS[researchId.toUpperCase()];
}

function getResearchByCategory(category) {
  return Object.values(RESEARCH_DEFINITIONS).filter(research => research.category === category);
}

function getResearchByTier(tier) {
  return Object.values(RESEARCH_DEFINITIONS).filter(research => research.tier === tier);
}

function checkResearchRequirements(research, userBuildings, userResearch) {
  // Check building requirements
  for (const [buildingType, requiredLevel] of Object.entries(research.requiredBuildings)) {
    const building = userBuildings.find(b => b.type === buildingType);
    if (!building || building.level < requiredLevel) {
      return {
        canResearch: false,
        reason: `Requires ${buildingType} level ${requiredLevel}`
      };
    }
  }
  
  // Check research prerequisites
  for (const prereqId of research.requiredResearch) {
    const hasPrereq = userResearch.some(r => r.id === prereqId && r.completed);
    if (!hasPrereq) {
      const prereq = RESEARCH_DEFINITIONS[prereqId.toUpperCase()];
      return {
        canResearch: false,
        reason: `Requires research: ${prereq?.name || prereqId}`
      };
    }
  }
  
  return { canResearch: true };
}

module.exports = {
  RESEARCH_DEFINITIONS,
  RESEARCH_CATEGORIES,
  getResearchById,
  getResearchByCategory,
  getResearchByTier,
  checkResearchRequirements
};
