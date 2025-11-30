/**
 * Règles et constantes du domaine Portails PvE
 * 
 * Système inspiré de Solo Leveling : portails colorés apparaissent aléatoirement,
 * contiennent des ennemis et du loot basé sur le tier.
 */

// Configuration des tiers de portails
const PORTAL_TIERS = {
  GREY: {
    name: 'Portail Gris',
    color: '#808080',
    rarity: 0.50, // 50% des spawns
    difficulty: 'facile',
    power_range: [500, 2000],
    duration: 14400, // 4h
    max_concurrent: 5,
    spawn_zones: 'everywhere'
  },
  
  GREEN: {
    name: 'Portail Vert',
    color: '#00FF00',
    rarity: 0.30, // 30%
    difficulty: 'moyen',
    power_range: [2000, 8000],
    duration: 10800, // 3h
    max_concurrent: 3,
    spawn_zones: 'everywhere'
  },
  
  BLUE: {
    name: 'Portail Bleu',
    color: '#00BFFF',
    rarity: 0.12, // 12%
    difficulty: 'difficile',
    power_range: [8000, 20000],
    duration: 7200, // 2h
    max_concurrent: 2,
    spawn_zones: 'everywhere'
  },
  
  PURPLE: {
    name: 'Portail Violet',
    color: '#9370DB',
    rarity: 0.06, // 6%
    difficulty: 'très difficile',
    power_range: [20000, 50000],
    duration: 5400, // 1h30
    max_concurrent: 1,
    spawn_zones: 'everywhere',
    announcement: 'global'
  },
  
  RED: {
    name: 'Portail Rouge',
    color: '#FF0000',
    rarity: 0.015, // 1.5%
    difficulty: 'cauchemar',
    power_range: [50000, 150000],
    duration: 3600, // 1h
    max_concurrent: 1,
    spawn_zones: 'everywhere',
    announcement: 'global',
    special: 'boss_inside'
  },
  
  GOLD: {
    name: 'Portail Doré',
    color: '#FFD700',
    rarity: 0.005, // 0.5% (ultra rare)
    difficulty: 'légendaire',
    power_range: [100000, 300000],
    duration: 1800, // 30min seulement !
    max_concurrent: 1,
    spawn_zones: 'random',
    announcement: 'global',
    special: 'legendary_loot',
    event: true
  }
};

// Templates d'ennemis par tier
const ENEMY_TEMPLATES = {
  GREY: [
    { type: 'Portal_Slime', attack: 3, defense: 2, cost: 50 },
    { type: 'Portal_Goblin', attack: 5, defense: 4, cost: 80 }
  ],
  GREEN: [
    { type: 'Portal_Orc', attack: 10, defense: 8, cost: 150 },
    { type: 'Portal_Wolf', attack: 12, defense: 6, cost: 180 }
  ],
  BLUE: [
    { type: 'Portal_Troll', attack: 20, defense: 18, cost: 400 },
    { type: 'Portal_Mage', attack: 25, defense: 15, cost: 500 }
  ],
  PURPLE: [
    { type: 'Portal_Demon', attack: 40, defense: 35, cost: 1000 },
    { type: 'Portal_Dragon', attack: 50, defense: 40, cost: 1500 }
  ],
  RED: [
    { type: 'Portal_Ancient', attack: 80, defense: 70, cost: 3000 },
    { type: 'Demon_Lord', attack: 120, defense: 100, cost: 5000 }
  ],
  GOLD: [
    { type: 'Void_Entity', attack: 150, defense: 120, cost: 8000 },
    { type: 'Reality_Bender', attack: 200, defense: 150, cost: 12000 }
  ]
};

// Tables de loot par tier
const LOOT_TABLES = {
  GREY: {
    guaranteed: {
      or: [500, 2000],
      metal: [300, 1000],
      xp: [10, 30]
    },
    random: [
      { item: 'speedup_1h', chance: 0.2 },
      { item: 'resource_boost_12h', chance: 0.15 }
    ]
  },
  
  GREEN: {
    guaranteed: {
      or: [2000, 5000],
      metal: [1500, 3000],
      carburant: [500, 1500],
      xp: [50, 100]
    },
    random: [
      { item: 'speedup_3h', chance: 0.3 },
      { item: 'blueprint_common', chance: 0.25 },
      { item: 'premium_currency', amount: [5, 15], chance: 0.1 }
    ]
  },
  
  BLUE: {
    guaranteed: {
      or: [5000, 15000],
      metal: [4000, 10000],
      carburant: [2000, 5000],
      xp: [150, 300]
    },
    random: [
      { item: 'speedup_12h', chance: 0.4 },
      { item: 'blueprint_rare', chance: 0.3 },
      { item: 'premium_currency', amount: [20, 50], chance: 0.2 },
      { item: 'unit_boost_token', chance: 0.15 }
    ]
  },
  
  PURPLE: {
    guaranteed: {
      or: [15000, 40000],
      metal: [10000, 25000],
      carburant: [5000, 12000],
      xp: [400, 800]
    },
    random: [
      { item: 'speedup_24h', chance: 0.5 },
      { item: 'blueprint_rare', chance: 0.5 },
      { item: 'blueprint_epic', chance: 0.2 },
      { item: 'premium_currency', amount: [50, 150], chance: 0.3 },
      { item: 'unique_unit_summon', chance: 0.1 }
    ]
  },
  
  RED: {
    guaranteed: {
      or: [50000, 100000],
      metal: [30000, 60000],
      carburant: [15000, 30000],
      xp: [1000, 2000]
    },
    random: [
      { item: 'blueprint_epic', chance: 0.7 },
      { item: 'blueprint_legendary', chance: 0.3 },
      { item: 'premium_currency', amount: [200, 500], chance: 0.5 },
      { item: 'cosmetic_rare', chance: 0.4 },
      { item: 'title_demon_slayer', chance: 0.2 }
    ],
    boss_loot: {
      guaranteed: { item: 'red_portal_essence', quantity: 1 },
      chance_legendary: 0.5
    }
  },
  
  GOLD: {
    guaranteed: {
      or: [100000, 250000],
      metal: [80000, 150000],
      carburant: [40000, 80000],
      xp: [3000, 5000],
      premium_currency: [500, 1000]
    },
    random: [
      { item: 'blueprint_legendary', chance: 1.0 }, // Garanti
      { item: 'unique_cosmetic_gold_portal', chance: 1.0 },
      { item: 'title_reality_breaker', chance: 1.0 }
    ],
    legendary_guaranteed: [
      'portal_master_skin',
      'golden_banner',
      'exclusive_unit_voidwalker'
    ]
  }
};

// Vitesse de déplacement vers portails (tiles par heure)
const PORTAL_TRAVEL_SPEED = 2;

/**
 * Génère les ennemis d'un portail selon son tier
 */
function generatePortalEnemies(tier, powerRange) {
  const [minPower, maxPower] = powerRange;
  const targetPower = Math.floor(Math.random() * (maxPower - minPower) + minPower);
  
  const availableEnemies = ENEMY_TEMPLATES[tier];
  const units = [];
  let currentPower = 0;
  
  while (currentPower < targetPower && availableEnemies.length > 0) {
    const enemy = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
    const remaining = targetPower - currentPower;
    const quantity = Math.max(1, Math.floor(remaining / enemy.cost / 2));
    
    units.push({
      type: enemy.type,
      quantity,
      attack: enemy.attack,
      defense: enemy.defense
    });
    
    currentPower += quantity * enemy.cost;
  }
  
  return { units, totalPower: currentPower };
}

/**
 * Génère le loot d'un portail selon son tier
 */
function generatePortalLoot(tier) {
  const lootConfig = LOOT_TABLES[tier];
  const finalLoot = { guaranteed: {}, random: [] };
  
  // Ressources garanties (ranges aléatoires)
  for (const [resource, range] of Object.entries(lootConfig.guaranteed)) {
    if (Array.isArray(range)) {
      finalLoot.guaranteed[resource] = Math.floor(Math.random() * (range[1] - range[0]) + range[0]);
    } else {
      finalLoot.guaranteed[resource] = range;
    }
  }
  
  // Loot random (rolls)
  if (lootConfig.random) {
    lootConfig.random.forEach(item => {
      if (Math.random() <= item.chance) {
        const lootItem = { item: item.item };
        
        if (item.amount && Array.isArray(item.amount)) {
          lootItem.amount = Math.floor(Math.random() * (item.amount[1] - item.amount[0]) + item.amount[0]);
        } else {
          lootItem.amount = 1;
        }
        
        finalLoot.random.push(lootItem);
      }
    });
  }
  
  return finalLoot;
}

/**
 * Calcule le temps de voyage vers un portail
 */
function calculateTravelTime(distance) {
  const hours = distance / PORTAL_TRAVEL_SPEED;
  return Math.ceil(hours * 3600); // Retourne en secondes
}

/**
 * Calcule les survivants après un combat
 */
function calculateSurvivors(units, lossPercentage) {
  const survivors = {};
  
  for (const [unitType, quantity] of Object.entries(units)) {
    const lost = Math.floor(quantity * lossPercentage);
    const surviving = quantity - lost;
    if (surviving > 0) {
      survivors[unitType] = surviving;
    }
  }
  
  return survivors;
}

/**
 * Sélectionne un tier de portail aléatoire selon les probabilités
 */
function selectRandomTier() {
  const roll = Math.random();
  let cumulativeProb = 0;
  
  for (const [tier, config] of Object.entries(PORTAL_TIERS)) {
    cumulativeProb += config.rarity;
    if (roll <= cumulativeProb) {
      return tier;
    }
  }
  
  return 'GREY'; // Fallback
}

module.exports = {
  PORTAL_TIERS,
  ENEMY_TEMPLATES,
  LOOT_TABLES,
  PORTAL_TRAVEL_SPEED,
  generatePortalEnemies,
  generatePortalLoot,
  calculateTravelTime,
  calculateSurvivors,
  selectRandomTier
};
