/**
 * Defense Definitions & Balance
 * Post-apocalyptic defensive structures - 8 defenses with counter system
 */

// Defense Tiers (unlock progression based on Defense Workshop)
const DEFENSE_TIERS = {
  TIER_1: { 
    name: 'Fortifications Basiques',
    requiredBuildings: { defenseWorkshop: 1 }
  },
  TIER_2: { 
    name: 'Défenses Actives',
    requiredBuildings: { defenseWorkshop: 3 }
  },
  TIER_3: { 
    name: 'Défenses Avancées',
    requiredBuildings: { defenseWorkshop: 5 }
  },
  TIER_4: { 
    name: 'Défenses Ultimes',
    requiredBuildings: { defenseWorkshop: 8 }
  }
};

// Complete defense roster - 8 defenses for base protection
const DEFENSE_DEFINITIONS = {
  // ============================================
  // TIER 1: FORTIFICATIONS BASIQUES (Defense Workshop Niv 1)
  // ============================================
  
  REINFORCED_WALL: {
    id: 'reinforced_wall',
    name: 'Murs Renforcés',
    description: 'Ralentit les attaquants et absorbe les dégâts.',
    tier: 1,
    category: 'fortification',
    icon: '🧱',
    
    // Combat stats
    attack: 0,
    defense: 15,
    health: 500,
    
    // Requirements
    requiredBuildings: {
      defenseWorkshop: 1
    },
    requiredResearch: [],
    
    // Costs
    cost: {
      gold: 100,
      metal: 150,
      fuel: 0
    },
    upkeepPerHour: {
      gold: 0,
      metal: 1,
      fuel: 0
    },
    buildTime: 120,
    
    // Counter system
    counters: ['militia', 'scouts'],
    weakTo: ['anti_armor', 'heavy_tank']
  },
  
  MACHINE_GUN_TURRET: {
    id: 'machine_gun_turret',
    name: 'Tourelle Mitrailleuse',
    description: 'Défense anti-infanterie automatique.',
    tier: 1,
    category: 'turret',
    icon: '🔫',
    
    attack: 8,
    defense: 5,
    health: 200,
    range: 'short',
    fireRate: 'fast',
    
    requiredBuildings: {
      defenseWorkshop: 1
    },
    requiredResearch: [],
    
    cost: {
      gold: 200,
      metal: 100,
      fuel: 50
    },
    upkeepPerHour: {
      gold: 2,
      metal: 1,
      fuel: 1
    },
    buildTime: 180,
    
    counters: ['militia', 'riflemen', 'scouts'],
    weakTo: ['light_tank', 'heavy_tank']
  },
  
  // ============================================
  // TIER 2: DÉFENSES ACTIVES (Defense Workshop Niv 3)
  // ============================================
  
  ELECTRIC_TRAP: {
    id: 'electric_trap',
    name: 'Pièges Électriques',
    description: 'Défense de zone qui immobilise et électrocute.',
    tier: 2,
    category: 'trap',
    icon: '⚡',
    
    attack: 5,
    defense: 0,
    health: 100,
    effect: 'stun',
    areaOfEffect: true,
    
    requiredBuildings: {
      defenseWorkshop: 3
    },
    requiredResearch: ['energy_efficiency_1'],
    
    cost: {
      gold: 150,
      metal: 80,
      fuel: 0,
      energy: 100
    },
    upkeepPerHour: {
      gold: 1,
      metal: 0,
      fuel: 0,
      energy: 3
    },
    buildTime: 150,
    
    counters: ['scouts', 'transport'],
    weakTo: ['marksmen']
  },
  
  ANTI_VEHICLE_TURRET: {
    id: 'anti_vehicle_turret',
    name: 'Tourelle Anti-Véhicule',
    description: 'Canon anti-blindage léger à longue portée.',
    tier: 2,
    category: 'turret',
    icon: '🎯',
    
    attack: 15,
    defense: 8,
    health: 300,
    range: 'long',
    fireRate: 'slow',
    
    requiredBuildings: {
      defenseWorkshop: 3
    },
    requiredResearch: ['targeting_systems_1'],
    
    cost: {
      gold: 300,
      metal: 200,
      fuel: 150
    },
    upkeepPerHour: {
      gold: 3,
      metal: 2,
      fuel: 2
    },
    buildTime: 240,
    
    counters: ['light_tank', 'transport'],
    weakTo: ['riflemen', 'militia']
  },
  
  // ============================================
  // TIER 3: DÉFENSES AVANCÉES (Defense Workshop Niv 5)
  // ============================================
  
  FORTIFIED_BUNKER: {
    id: 'fortified_bunker',
    name: 'Bunker Fortifié',
    description: 'Point de résistance qui abrite des troupes.',
    tier: 3,
    category: 'fortification',
    icon: '🏰',
    
    attack: 10,
    defense: 25,
    health: 1000,
    garrisonCapacity: 50,
    
    requiredBuildings: {
      defenseWorkshop: 5
    },
    requiredResearch: ['fortifications_2'],
    
    cost: {
      gold: 500,
      metal: 400,
      fuel: 200
    },
    upkeepPerHour: {
      gold: 5,
      metal: 3,
      fuel: 1
    },
    buildTime: 360,
    
    counters: ['riflemen', 'scouts', 'militia', 'light_tank'],
    weakTo: ['heavy_tank', 'anti_armor']
  },
  
  ANTI_TANK_CANNON: {
    id: 'anti_tank_cannon',
    name: 'Canon Anti-Tank',
    description: 'Artillerie lourde pour détruire les blindés.',
    tier: 3,
    category: 'artillery',
    icon: '💥',
    
    attack: 25,
    defense: 5,
    health: 400,
    range: 'very_long',
    fireRate: 'very_slow',
    
    requiredBuildings: {
      defenseWorkshop: 5
    },
    requiredResearch: ['anti_armor_weapons'],
    
    cost: {
      gold: 600,
      metal: 450,
      fuel: 300
    },
    upkeepPerHour: {
      gold: 6,
      metal: 4,
      fuel: 3
    },
    buildTime: 420,
    
    counters: ['heavy_tank', 'light_tank'],
    weakTo: ['scouts', 'riflemen']
  },
  
  // ============================================
  // TIER 4: DÉFENSES ULTIMES (Defense Workshop Niv 8+)
  // ============================================
  
  PLASMA_TURRET: {
    id: 'plasma_turret',
    name: 'Tourelle Plasma',
    description: 'Défense à énergie avancée, équilibrée contre toutes unités.',
    tier: 4,
    category: 'turret_advanced',
    icon: '⚡',
    
    attack: 20,
    defense: 12,
    health: 500,
    range: 'medium',
    fireRate: 'fast',
    damageType: 'energy',
    
    requiredBuildings: {
      defenseWorkshop: 8
    },
    requiredResearch: ['energy_weapons', 'power_plant_5'],
    
    cost: {
      gold: 800,
      metal: 500,
      fuel: 0,
      energy: 400
    },
    upkeepPerHour: {
      gold: 8,
      metal: 4,
      fuel: 0,
      energy: 10
    },
    buildTime: 480,
    
    counters: ['militia', 'riflemen', 'scouts', 'light_tank', 'marksmen'],
    weakTo: []
  },
  
  ENERGY_SHIELD: {
    id: 'energy_shield',
    name: 'Bouclier Énergétique',
    description: 'Protection de zone qui réduit les dégâts à distance.',
    tier: 4,
    category: 'shield',
    icon: '🛡️',
    
    attack: 0,
    defense: 30,
    health: 800,
    shieldStrength: 1000,
    damageReduction: 0.5,
    
    requiredBuildings: {
      defenseWorkshop: 10
    },
    requiredResearch: ['energy_shields'],
    
    cost: {
      gold: 1000,
      metal: 600,
      fuel: 0,
      energy: 800
    },
    upkeepPerHour: {
      gold: 10,
      metal: 5,
      fuel: 0,
      energy: 15
    },
    buildTime: 600,
    
    counters: ['heavy_tank', 'light_tank', 'anti_armor'],
    weakTo: ['riflemen', 'scouts']
  }
};

// Helper functions
function getDefenseById(defenseId) {
  return DEFENSE_DEFINITIONS[defenseId.toUpperCase()];
}

function getDefensesByTier(tier) {
  return Object.values(DEFENSE_DEFINITIONS).filter(defense => defense.tier === tier);
}

function getDefensesByCategory(category) {
  return Object.values(DEFENSE_DEFINITIONS).filter(defense => defense.category === category);
}

function calculateDefenseEffectiveness(defense, attackingUnit) {
  let effectiveness = 1.0;
  
  // Check if defense counters the attacking unit
  if (defense.counters.includes(attackingUnit.id)) {
    effectiveness *= 1.5;  // 50% more effective
  }
  
  // Check if defense is weak against the attacking unit
  if (defense.weakTo.includes(attackingUnit.id)) {
    effectiveness *= 0.7;  // 30% less effective
  }
  
  return effectiveness;
}

module.exports = {
  DEFENSE_DEFINITIONS,
  DEFENSE_TIERS,
  getDefenseById,
  getDefensesByTier,
  getDefensesByCategory,
  calculateDefenseEffectiveness
};
