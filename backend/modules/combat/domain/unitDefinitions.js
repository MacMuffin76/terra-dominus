/**
 * Unit Definitions & Balance
 * Comprehensive unit system with rock-paper-scissors counters
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

// Unit Tiers (unlock progression)
const UNIT_TIERS = {
  TIER_1: { unlockLevel: 1, name: 'Basic Units' },
  TIER_2: { unlockLevel: 5, name: 'Advanced Units' },
  TIER_3: { unlockLevel: 10, name: 'Elite Units' },
  TIER_4: { unlockLevel: 15, name: 'Experimental Units' }
};

// Complete unit roster
const UNIT_DEFINITIONS = {
  // ============================================
  // TIER 1: BASIC UNITS (Early Game 0-5)
  // ============================================
  
  MILITIA: {
    id: 'militia',
    name: 'Militia',
    description: 'Untrained civilians with basic weapons. Cheap cannon fodder.',
    tier: 1,
    category: 'infantry',
    
    // Combat stats
    attack: 2,
    defense: 3,
    health: 10,
    initiative: 5,
    
    // Movement & utility
    speed: 1.0,           // Base movement speed
    carryCapacity: 10,    // Loot capacity per unit
    
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
    trainTime: 30,        // seconds
    
    // Counter system
    counters: [],          // Good against (50% bonus)
    weakTo: ['infantry', 'cavalry', 'tanks']  // Bad against (30% penalty)
  },
  
  INFANTRY: {
    id: 'infantry',
    name: 'Infantry',
    description: 'Standard foot soldiers with rifles. Versatile and cost-effective.',
    tier: 1,
    category: 'infantry',
    
    attack: 5,
    defense: 4,
    health: 20,
    initiative: 10,
    
    speed: 1.0,
    carryCapacity: 20,
    
    cost: {
      gold: 100,
      metal: 50,
      fuel: 0
    },
    upkeepPerHour: {
      gold: 1,
      metal: 0,
      fuel: 0
    },
    trainTime: 60,
    
    counters: ['militia'],
    weakTo: ['cavalry', 'artillery', 'tanks']
  },
  
  ARCHER: {
    id: 'archer',
    name: 'Archer',
    description: 'Ranged attackers with bows. Good for defense and sieges.',
    tier: 1,
    category: 'ranged',
    
    attack: 6,
    defense: 2,
    health: 15,
    initiative: 15,
    
    speed: 1.0,
    carryCapacity: 15,
    
    cost: {
      gold: 120,
      metal: 40,
      fuel: 0
    },
    upkeepPerHour: {
      gold: 1,
      metal: 0,
      fuel: 0
    },
    trainTime: 75,
    
    counters: ['infantry', 'cavalry'],
    weakTo: ['cavalry_charge', 'fortifications']
  },
  
  // ============================================
  // TIER 2: ADVANCED UNITS (Mid Game 5-10)
  // ============================================
  
  CAVALRY: {
    id: 'cavalry',
    name: 'Cavalry',
    description: 'Fast mounted units. Excellent for raids and flanking.',
    tier: 2,
    category: 'mounted',
    
    attack: 8,
    defense: 5,
    health: 30,
    initiative: 25,
    
    speed: 2.0,           // 2x faster travel
    carryCapacity: 30,
    
    cost: {
      gold: 250,
      metal: 100,
      fuel: 50
    },
    upkeepPerHour: {
      gold: 2,
      metal: 1,
      fuel: 1
    },
    trainTime: 120,
    
    counters: ['infantry', 'archer', 'artillery'],
    weakTo: ['spearmen', 'fortifications', 'tanks']
  },
  
  SPEARMEN: {
    id: 'spearmen',
    name: 'Spearmen',
    description: 'Anti-cavalry specialists with long pikes. Defensive formation.',
    tier: 2,
    category: 'infantry',
    
    attack: 6,
    defense: 8,
    health: 25,
    initiative: 8,
    
    speed: 1.0,
    carryCapacity: 15,
    
    cost: {
      gold: 200,
      metal: 80,
      fuel: 0
    },
    upkeepPerHour: {
      gold: 2,
      metal: 0,
      fuel: 0
    },
    trainTime: 90,
    
    counters: ['cavalry'],
    weakTo: ['artillery', 'tanks', 'aircraft']
  },
  
  ARTILLERY: {
    id: 'artillery',
    name: 'Artillery',
    description: 'Heavy siege weapons. Devastating against fortifications.',
    tier: 2,
    category: 'siege',
    
    attack: 12,
    defense: 2,
    health: 15,
    initiative: 3,
    
    speed: 0.5,           // Very slow
    carryCapacity: 0,     // Can't carry loot
    
    cost: {
      gold: 400,
      metal: 300,
      fuel: 100
    },
    upkeepPerHour: {
      gold: 3,
      metal: 2,
      fuel: 2
    },
    trainTime: 180,
    
    counters: ['fortifications', 'infantry', 'spearmen'],
    weakTo: ['cavalry', 'aircraft', 'tanks']
  },
  
  ENGINEER: {
    id: 'engineer',
    name: 'Combat Engineer',
    description: 'Support unit. Repairs walls and disables traps.',
    tier: 2,
    category: 'support',
    
    attack: 3,
    defense: 4,
    health: 20,
    initiative: 12,
    
    speed: 1.0,
    carryCapacity: 25,
    
    cost: {
      gold: 300,
      metal: 150,
      fuel: 50
    },
    upkeepPerHour: {
      gold: 2,
      metal: 1,
      fuel: 0
    },
    trainTime: 150,
    
    counters: ['fortifications', 'traps'],
    weakTo: ['cavalry', 'infantry']
  },
  
  // ============================================
  // TIER 3: ELITE UNITS (Late Game 10-15)
  // ============================================
  
  TANKS: {
    id: 'tanks',
    name: 'Tanks',
    description: 'Armored behemoths. High attack and defense, expensive.',
    tier: 3,
    category: 'armored',
    
    attack: 20,
    defense: 18,
    health: 100,
    initiative: 8,
    
    speed: 1.5,
    carryCapacity: 50,
    
    cost: {
      gold: 800,
      metal: 600,
      fuel: 400
    },
    upkeepPerHour: {
      gold: 5,
      metal: 3,
      fuel: 3
    },
    trainTime: 300,
    
    counters: ['infantry', 'cavalry', 'fortifications', 'artillery'],
    weakTo: ['anti_tank', 'aircraft', 'mines']
  },
  
  ANTI_TANK: {
    id: 'anti_tank',
    name: 'Anti-Tank Infantry',
    description: 'Tank hunters with RPGs and explosives.',
    tier: 3,
    category: 'infantry',
    
    attack: 15,
    defense: 10,
    health: 30,
    initiative: 15,
    
    speed: 1.0,
    carryCapacity: 10,
    
    cost: {
      gold: 600,
      metal: 400,
      fuel: 200
    },
    upkeepPerHour: {
      gold: 4,
      metal: 2,
      fuel: 2
    },
    trainTime: 240,
    
    counters: ['tanks', 'armored'],
    weakTo: ['infantry', 'aircraft', 'cavalry']
  },
  
  AIRCRAFT: {
    id: 'aircraft',
    name: 'Fighter Aircraft',
    description: 'Air superiority. Very fast, devastating attack, fragile.',
    tier: 3,
    category: 'air',
    
    attack: 25,
    defense: 8,
    health: 40,
    initiative: 30,
    
    speed: 3.0,           // 3x faster travel
    carryCapacity: 10,
    
    cost: {
      gold: 1500,
      metal: 1000,
      fuel: 800
    },
    upkeepPerHour: {
      gold: 8,
      metal: 5,
      fuel: 5
    },
    trainTime: 600,
    
    counters: ['tanks', 'artillery', 'fortifications', 'infantry'],
    weakTo: ['anti_air', 'aircraft']
  },
  
  ANTI_AIR: {
    id: 'anti_air',
    name: 'Anti-Air Battery',
    description: 'Mobile SAM launchers. Shreds aircraft.',
    tier: 3,
    category: 'defense',
    
    attack: 18,
    defense: 12,
    health: 50,
    initiative: 20,
    
    speed: 1.0,
    carryCapacity: 5,
    
    cost: {
      gold: 1200,
      metal: 800,
      fuel: 600
    },
    upkeepPerHour: {
      gold: 6,
      metal: 4,
      fuel: 3
    },
    trainTime: 480,
    
    counters: ['aircraft'],
    weakTo: ['tanks', 'infantry', 'artillery']
  },
  
  // ============================================
  // TIER 4: EXPERIMENTAL UNITS (End Game 15+)
  // ============================================
  
  MECH: {
    id: 'mech',
    name: 'Battle Mech',
    description: 'Experimental war machine. Extremely powerful but very expensive.',
    tier: 4,
    category: 'experimental',
    
    attack: 35,
    defense: 30,
    health: 200,
    initiative: 15,
    
    speed: 1.2,
    carryCapacity: 100,
    
    cost: {
      gold: 3000,
      metal: 2500,
      fuel: 2000
    },
    upkeepPerHour: {
      gold: 15,
      metal: 10,
      fuel: 10
    },
    trainTime: 1800,      // 30 minutes
    
    counters: ['tanks', 'infantry', 'cavalry', 'fortifications'],
    weakTo: ['aircraft', 'emp', 'artillery']
  },
  
  STEALTH_BOMBER: {
    id: 'stealth_bomber',
    name: 'Stealth Bomber',
    description: 'Strategic bomber. Can bypass some defenses.',
    tier: 4,
    category: 'air',
    
    attack: 40,
    defense: 5,
    health: 60,
    initiative: 25,
    
    speed: 3.5,
    carryCapacity: 20,
    
    cost: {
      gold: 5000,
      metal: 3000,
      fuel: 2500
    },
    upkeepPerHour: {
      gold: 20,
      metal: 12,
      fuel: 15
    },
    trainTime: 3600,      // 1 hour
    
    counters: ['fortifications', 'tanks', 'artillery'],
    weakTo: ['anti_air', 'aircraft']
  },
  
  // ============================================
  // SPECIAL UNITS
  // ============================================
  
  SPY: {
    id: 'spy',
    name: 'Spy',
    description: 'Espionage unit. Gathers intelligence, sabotages.',
    tier: 2,
    category: 'special',
    
    attack: 1,
    defense: 1,
    health: 5,
    initiative: 50,       // Always acts first
    
    speed: 2.0,
    carryCapacity: 0,
    
    cost: {
      gold: 500,
      metal: 100,
      fuel: 50
    },
    upkeepPerHour: {
      gold: 3,
      metal: 0,
      fuel: 1
    },
    trainTime: 300,
    
    counters: [],
    weakTo: ['counter_intel']
  }
};

// Helper functions
function getUnitById(unitId) {
  return UNIT_DEFINITIONS[unitId.toUpperCase()];
}

function getUnitsByTier(tier) {
  return Object.values(UNIT_DEFINITIONS).filter(unit => unit.tier === tier);
}

function getUnitsByCategory(category) {
  return Object.values(UNIT_DEFINITIONS).filter(unit => unit.category === category);
}

function calculateCounterMultiplier(attackerUnit, defenderUnit) {
  let multiplier = 1.0;
  
  // Check if attacker counters defender
  if (attackerUnit.counters.includes(defenderUnit.id)) {
    multiplier *= BALANCE_CONFIG.COUNTER_BONUS;
  }
  
  // Check if attacker is weak to defender
  if (attackerUnit.weakTo.includes(defenderUnit.id) || 
      attackerUnit.weakTo.includes(defenderUnit.category)) {
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
