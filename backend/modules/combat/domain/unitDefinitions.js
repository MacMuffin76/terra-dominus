/**
 * Unit Definitions & Balance
 * Post-apocalyptic ground warfare - 8 units with counter system
 */

// Counter system multipliers
const BALANCE_CONFIG = {
  COUNTER_BONUS: 1.5,        // 50% bonus when unit counters target
  WEAK_TO_PENALTY: 0.7,      // 30% penalty when unit is countered
  FLANKING_BONUS: 1.2,       // 20% bonus for tactical positioning
  MORALE_MULTIPLIER: {
    HIGH: 1.3,               // +30% when winning
    NORMAL: 1.0,
    LOW: 0.8                 // -20% when losing
  }
};

// Unit Tiers (unlock progression based on Training Center + Forge + Research)
const UNIT_TIERS = {
  TIER_1: { 
    name: 'Survivants',
    requiredBuildings: { trainingCenter: 1 }
  },
  TIER_2: { 
    name: 'Forces Organisées',
    requiredBuildings: { trainingCenter: 3 }
  },
  TIER_3: { 
    name: 'Forces Mécanisées',
    requiredBuildings: { trainingCenter: 5, forge: 3 }
  },
  TIER_4: { 
    name: 'Forces d\'Élite',
    requiredBuildings: { trainingCenter: 10, forge: 6 }
  }
};

// Complete unit roster - 8 units for post-apocalyptic warfare
const UNIT_DEFINITIONS = {
  // ============================================
  // TIER 1: SURVIVANTS (Training Center Niv 1)
  // ============================================
  
  MILITIA: {
    id: 'militia',
    name: 'Milice',
    description: 'Civils armés de fortune. Chair à canon et exploration.',
    tier: 1,
    category: 'infantry',
    icon: '👥',
    
    // Combat stats
    attack: 2,
    defense: 2,
    health: 15,
    initiative: 5,
    
    // Movement & utility
    speed: 1.0,
    carryCapacity: 10,
    
    // Requirements
    requiredBuildings: {
      trainingCenter: 1
    },
    requiredResearch: [],
    
    // Costs
    cost: {
      gold: 50,
      metal: 20,
      fuel: 0
    },
    upkeepPerHour: {
      gold: 1,
      metal: 0,
      fuel: 0
    },
    trainTime: 30,
    
    // Counter system
    counters: [],
    weakTo: ['riflemen', 'scouts', 'marksmen', 'light_tank', 'anti_armor', 'heavy_tank']
  },
  
  RIFLEMEN: {
    id: 'riflemen',
    name: 'Fusiliers',
    description: 'Infanterie standard polyvalente avec armes automatiques.',
    tier: 1,
    category: 'infantry',
    icon: '🔫',
    
    attack: 5,
    defense: 4,
    health: 25,
    initiative: 10,
    
    speed: 1.0,
    carryCapacity: 20,
    
    requiredBuildings: {
      trainingCenter: 1
    },
    requiredResearch: ['military_training_1'],
    
    cost: {
      gold: 100,
      metal: 50,
      fuel: 0
    },
    upkeepPerHour: {
      gold: 2,
      metal: 0,
      fuel: 0
    },
    trainTime: 60,
    
    counters: ['militia', 'engineer'],
    weakTo: ['scouts', 'light_tank', 'heavy_tank']
  },
  
  // ============================================
  // TIER 2: FORCES ORGANISÉES (Training Center Niv 3)
  // ============================================
  
  SCOUTS: {
    id: 'scouts',
    name: 'Éclaireurs',
    description: 'Infanterie rapide spécialisée en reconnaissance et raids éclair.',
    tier: 2,
    category: 'infantry_fast',
    icon: '🏃',
    
    attack: 6,
    defense: 3,
    health: 20,
    initiative: 18,
    
    speed: 1.5,
    carryCapacity: 30,
    
    requiredBuildings: {
      trainingCenter: 3
    },
    requiredResearch: ['guerrilla_tactics_1'],
    
    cost: {
      gold: 150,
      metal: 60,
      fuel: 30
    },
    upkeepPerHour: {
      gold: 3,
      metal: 1,
      fuel: 1
    },
    trainTime: 90,
    
    counters: ['riflemen', 'engineer', 'transport'],
    weakTo: ['marksmen']
  },
  
  TRANSPORT: {
    id: 'transport',
    name: 'Transport Blindé',
    description: 'Véhicule de transport de troupes et ressources. Non-combattant.',
    tier: 2,
    category: 'support',
    icon: '🚚',
    
    attack: 1,
    defense: 6,
    health: 50,
    initiative: 3,
    
    speed: 1.0,
    carryCapacity: 200,
    
    requiredBuildings: {
      trainingCenter: 2,
      forge: 1
    },
    requiredResearch: ['motorization_1'],
    
    cost: {
      gold: 200,
      metal: 120,
      fuel: 80
    },
    upkeepPerHour: {
      gold: 2,
      metal: 1,
      fuel: 2
    },
    trainTime: 120,
    
    counters: [],
    weakTo: ['scouts', 'anti_armor', 'light_tank', 'heavy_tank']
  },
  
  ENGINEER: {
    id: 'engineer',
    name: 'Sapeurs',
    description: 'Unité de soutien pour réparation et sabotage.',
    tier: 2,
    category: 'support',
    icon: '🔧',
    
    attack: 3,
    defense: 4,
    health: 20,
    initiative: 12,
    
    speed: 1.0,
    carryCapacity: 25,
    
    requiredBuildings: {
      trainingCenter: 3
    },
    requiredResearch: [],
    
    cost: {
      gold: 180,
      metal: 150,
      fuel: 50
    },
    upkeepPerHour: {
      gold: 3,
      metal: 2,
      fuel: 1
    },
    trainTime: 150,
    
    counters: [],
    weakTo: ['riflemen', 'scouts']
  },
  
  // ============================================
  // TIER 3: FORCES MÉCANISÉES (Training Center Niv 5 + Forge Niv 3)
  // ============================================
  
  MARKSMEN: {
    id: 'marksmen',
    name: 'Tireurs d\'Élite',
    description: 'Infanterie spécialisée anti-infanterie avec armes de précision.',
    tier: 3,
    category: 'infantry_specialist',
    icon: '🎯',
    
    attack: 10,
    defense: 5,
    health: 30,
    initiative: 20,
    
    speed: 0.8,
    carryCapacity: 15,
    
    requiredBuildings: {
      trainingCenter: 5,
      forge: 1
    },
    requiredResearch: ['military_training_2'],
    
    cost: {
      gold: 250,
      metal: 100,
      fuel: 50
    },
    upkeepPerHour: {
      gold: 4,
      metal: 1,
      fuel: 1
    },
    trainTime: 150,
    
    counters: ['scouts', 'riflemen', 'militia'],
    weakTo: ['light_tank', 'heavy_tank']
  },
  
  LIGHT_TANK: {
    id: 'light_tank',
    name: 'Chars Légers',
    description: 'Blindés légers pour appui anti-infanterie et mobilité.',
    tier: 3,
    category: 'armored',
    icon: '🛡️',
    
    attack: 12,
    defense: 14,
    health: 80,
    initiative: 8,
    
    speed: 1.0,
    carryCapacity: 50,
    
    requiredBuildings: {
      trainingCenter: 4,
      forge: 3
    },
    requiredResearch: ['motorization_2'],
    
    cost: {
      gold: 400,
      metal: 300,
      fuel: 200
    },
    upkeepPerHour: {
      gold: 5,
      metal: 3,
      fuel: 3
    },
    trainTime: 240,
    
    counters: ['riflemen', 'marksmen', 'scouts'],
    weakTo: ['anti_armor', 'heavy_tank']
  },
  
  // ============================================
  // TIER 4: FORCES D'ÉLITE (Training Center Niv 8+)
  // ============================================
  
  ANTI_ARMOR: {
    id: 'anti_armor',
    name: 'Anti-Blindage',
    description: 'Infanterie lourde chasseuse de tanks avec lance-roquettes.',
    tier: 4,
    category: 'infantry_heavy',
    icon: '💥',
    
    attack: 15,
    defense: 8,
    health: 35,
    initiative: 12,
    
    speed: 0.7,
    carryCapacity: 20,
    
    requiredBuildings: {
      trainingCenter: 5,
      forge: 2
    },
    requiredResearch: ['anti_tank_weapons'],
    
    cost: {
      gold: 350,
      metal: 250,
      fuel: 150
    },
    upkeepPerHour: {
      gold: 6,
      metal: 3,
      fuel: 2
    },
    trainTime: 180,
    
    counters: ['light_tank', 'heavy_tank', 'transport'],
    weakTo: ['marksmen', 'riflemen']
  },
  
  HEAVY_TANK: {
    id: 'heavy_tank',
    name: 'Tanks Lourds',
    description: 'Blindés ultra-lourds. Unité de choc pour percer les lignes ennemies.',
    tier: 4,
    category: 'armored_heavy',
    icon: '🚀',
    
    attack: 25,
    defense: 22,
    health: 150,
    initiative: 5,
    
    speed: 0.6,
    carryCapacity: 100,
    
    requiredBuildings: {
      trainingCenter: 8,
      forge: 6
    },
    requiredResearch: ['heavy_armor'],
    
    cost: {
      gold: 800,
      metal: 600,
      fuel: 400
    },
    upkeepPerHour: {
      gold: 10,
      metal: 5,
      fuel: 5
    },
    trainTime: 360,
    
    counters: ['light_tank', 'riflemen'],
    weakTo: ['anti_armor']
  }
};

// Helper functions
function getUnitById(unitId) {
  if (!unitId) return null;
  
  const normalized = unitId.toUpperCase();
  const unit = UNIT_DEFINITIONS[normalized];
  
  // Si pas trouvé directement, chercher par name
  if (!unit) {
    return Object.values(UNIT_DEFINITIONS).find(u => 
      u.name.toLowerCase() === unitId.toLowerCase() || 
      u.id === unitId.toLowerCase()
    );
  }
  
  return unit;
}

function getUnitsByTier(tier) {
  return Object.values(UNIT_DEFINITIONS).filter(unit => unit.tier === tier);
}

function getUnitsByCategory(category) {
  return Object.values(UNIT_DEFINITIONS).filter(unit => unit.category === category);
}

function calculateCounterMultiplier(attackerUnit, defenderUnit) {
  if (!attackerUnit || !defenderUnit) return 1.0;
  
  let multiplier = 1.0;
  
  // Check if attacker counters defender
  if (attackerUnit.counters?.includes(defenderUnit.id)) {
    multiplier *= BALANCE_CONFIG.COUNTER_BONUS;
  }
  
  // Check if attacker is weak to defender
  if (attackerUnit.weakTo?.includes(defenderUnit.id) || 
      attackerUnit.weakTo?.includes(defenderUnit.category)) {
    multiplier *= BALANCE_CONFIG.WEAK_TO_PENALTY;
  }
  
  return multiplier;
}

function calculateUnitPower(unit, quantity, multipliers = {}) {
  const basePower = unit.attack * quantity;
  const counterMultiplier = multipliers.counter || 1.0;
  const moraleMultiplier = multipliers.morale || BALANCE_CONFIG.MORALE_MULTIPLIER.NORMAL;
  const flankingMultiplier = multipliers.flanking || 1.0;
  
  return basePower * counterMultiplier * moraleMultiplier * flankingMultiplier;
}

module.exports = {
  UNIT_DEFINITIONS,
  BALANCE_CONFIG,
  UNIT_TIERS,
  getUnitById,
  getUnitsByTier,
  getUnitsByCategory,
  calculateCounterMultiplier,
  calculateUnitPower
};
