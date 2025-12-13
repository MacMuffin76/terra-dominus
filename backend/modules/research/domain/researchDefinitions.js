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

// New research definitions based on user provided list with logical costs and descriptions
const RESEARCH_DEFINITIONS = {
  ENERGY_SHIELDS: {
    id: 'energy_shields',
    name: 'Boucliers Énergétiques',
    description: 'Débloque Bouclier Énergétique. Protection de zone avancée.',
    category: RESEARCH_CATEGORIES.DEFENSE,
    tier: 4,
    icon: 'boucliers_energetiques.png',
    requiredBuildings: { researchLab: 10, defenseWorkshop: 10, powerPlant: 5 },
    requiredResearch: ['energy_weapons'],
    cost: { gold: 8000, metal: 5000, fuel: 0, energy: 3000 },
    researchTime: 3600,
    effects: { unlocks: ['energy_shield'] }
  },
  FORTIFICATIONS: {
    id: 'fortifications',
    name: 'Fortifications',
    description: 'Renforce la durabilité des murs et bunkers.',
    category: RESEARCH_CATEGORIES.DEFENSE,
    tier: 3,
    icon: 'fortifications.png',
    requiredBuildings: { researchLab: 5, defenseWorkshop: 5 },
    requiredResearch: [],
    cost: { gold: 1500, metal: 1200, fuel: 500 },
    researchTime: 1200,
    effects: { fortificationHPBonus: 0.30 }
  },
  TARGETING_SYSTEMS: {
    id: 'targeting_systems',
    name: 'Systèmes de Ciblage',
    description: 'Améliore la précision des tourelles anti-véhicules.',
    category: RESEARCH_CATEGORIES.DEFENSE,
    tier: 2,
    icon: 'systemes_de_ciblage.png',
    requiredBuildings: { researchLab: 3, defenseWorkshop: 3 },
    requiredResearch: [],
    cost: { gold: 800, metal: 600, fuel: 300 },
    researchTime: 600,
    effects: { turretAccuracyBonus: 0.15 }
  },
  ADVANCED_EXTRACTION: {
    id: 'advanced_extraction',
    name: 'Extraction Avancée',
    description: 'Augmente la production de ressources.',
    category: RESEARCH_CATEGORIES.ECONOMY,
    tier: 2,
    icon: 'extraction_avancee.png',
    requiredBuildings: { researchLab: 3 },
    requiredResearch: [],
    cost: { gold: 1200, metal: 800, fuel: 300 },
    researchTime: 1200,
    effects: { productionBonus: { gold: 0.20, metal: 0.20, fuel: 0.20 } }
  },
  ENERGY_EFFICIENCY: {
    id: 'energy_efficiency',
    name: 'Efficacité Énergétique',
    description: 'Réduit la consommation d\'énergie.',
    category: RESEARCH_CATEGORIES.ECONOMY,
    tier: 1,
    icon: 'efficacite_energetique.png',
    requiredBuildings: { researchLab: 1, powerPlant: 2 },
    requiredResearch: [],
    cost: { gold: 400, metal: 200, fuel: 150, energy: 100 },
    researchTime: 480,
    effects: { energyConsumptionReduction: 0.15 }
  },
  LOGISTICS: {
    id: 'logistics',
    name: 'Logistique',
    description: 'Augmente la capacité de stockage.',
    category: RESEARCH_CATEGORIES.ECONOMY,
    tier: 1,
    icon: 'logistique.png',
    requiredBuildings: { researchLab: 2 },
    requiredResearch: [],
    cost: { gold: 600, metal: 400, fuel: 200 },
    researchTime: 720,
    effects: { storageBonus: 0.20 }
  },
  CARTOGRAPHY: {
    id: 'cartography',
    name: 'Cartographie',
    description: 'Améliore la vision de la carte.',
    category: RESEARCH_CATEGORIES.EXPLORATION,
    tier: 1,
    icon: 'cartographie.png',
    requiredBuildings: { researchLab: 1 },
    requiredResearch: [],
    cost: { gold: 300, metal: 100, fuel: 100 },
    researchTime: 240,
    effects: { visionBonus: 2 }
  },
  RAPID_LOGISTICS: {
    id: 'rapid_logistics',
    name: 'Logistique rapide',
    description: 'Réduit le temps de déplacement des armées.',
    category: RESEARCH_CATEGORIES.EXPLORATION,
    tier: 2,
    icon: 'logistique_rapide.png',
    requiredBuildings: { researchLab: 3 },
    requiredResearch: ['logistics'],
    cost: { gold: 1000, metal: 600, fuel: 400 },
    researchTime: 720,
    effects: { travelTimeReduction: 0.15 }
  },
  ENERGY_WEAPONS: {
    id: 'energy_weapons',
    name: 'Armes à Énergie',
    description: 'Débloque tourelles plasma et augmente les dégâts d\'énergie.',
    category: RESEARCH_CATEGORIES.MILITARY_ADVANCED,
    tier: 4,
    icon: 'armes_a_energie.png',
    requiredBuildings: { researchLab: 8, powerPlant: 5 },
    requiredResearch: ['energy_efficiency'],
    cost: { gold: 4000, metal: 3000, fuel: 0, energy: 2000 },
    researchTime: 2100,
    effects: { unlocks: ['plasma_turret'], energyDamageBonus: 0.10 }
  },
  SPECIAL_FORCES: {
    id: 'special_forces',
    name: 'Forces Spéciales',
    description: 'Augmente l\'initiative des unités de Tier 3 et plus.',
    category: RESEARCH_CATEGORIES.MILITARY_ADVANCED,
    tier: 4,
    icon: 'forces_speciales.png',
    requiredBuildings: { researchLab: 10, trainingCenter: 10 },
    requiredResearch: ['military_training_2', 'guerrilla_tactics_1'],
    cost: { gold: 6000, metal: 4000, fuel: 2000 },
    researchTime: 3000,
    effects: { initiativeBonus: 0.25 }
  },
  MILITARY_TRAINING_1: {
    id: 'military_training_1',
    name: 'Formation Militaire',
    description: 'Débloque Fusiliers et augmente l\'attaque de l\'infanterie.',
    category: RESEARCH_CATEGORIES.MILITARY_INFANTRY,
    tier: 1,
    icon: 'formation_militaire.png',
    requiredBuildings: { researchLab: 1, trainingCenter: 1 },
    requiredResearch: [],
    cost: { gold: 300, metal: 200, fuel: 0 },
    researchTime: 300,
    effects: { unlocks: ['riflemen'], infantryAttackBonus: 0.05 }
  },
  MILITARY_TRAINING_2: {
    id: 'military_training_2',
    name: 'Formation Militaire Avancée',
    description: 'Débloque Tireurs d\'Élite et améliore l\'entraînement de l\'infanterie.',
    category: RESEARCH_CATEGORIES.MILITARY_INFANTRY,
    tier: 2,
    icon: 'formation_militaire_2.png',
    requiredBuildings: { researchLab: 3, trainingCenter: 5 },
    requiredResearch: ['military_training_1'],
    cost: { gold: 800, metal: 500, fuel: 200 },
    researchTime: 600,
    effects: { unlocks: ['marksmen'], infantryAttackBonus: 0.10 }
  },
  GUERRILLA_TACTICS_1: {
    id: 'guerrilla_tactics_1',
    name: 'Tactiques de Guérilla I',
    description: 'Débloque Éclaireurs et améliore la vitesse de l\'infanterie légère.',
    category: RESEARCH_CATEGORIES.MILITARY_INFANTRY,
    tier: 2,
    icon: 'guerrilla_tactics.png',
    requiredBuildings: { researchLab: 2, trainingCenter: 3 },
    requiredResearch: ['military_training_1'],
    cost: { gold: 500, metal: 300, fuel: 200 },
    researchTime: 420,
    effects: { unlocks: ['scouts'], infantrySpeedBonus: 0.15 }
  },
  MOTORIZATION_1: {
    id: 'motorization_1',
    name: 'Motorisation I',
    description: 'Débloque Transport Blindé. Premiers véhicules motorisés.',
    category: RESEARCH_CATEGORIES.MILITARY_VEHICLES,
    tier: 2,
    icon: 'motorization_1.png',
    requiredBuildings: { researchLab: 2, forge: 1 },
    requiredResearch: [],
    cost: { gold: 600, metal: 400, fuel: 300 },
    researchTime: 480,
    effects: { unlocks: ['transport'], vehicleSpeedBonus: 0.05 }
  },
  MOTORIZATION_2: {
    id: 'motorization_2',
    name: 'Motorisation II',
    description: 'Débloque Chars Légers. Véhicules de combat blindés.',
    category: RESEARCH_CATEGORIES.MILITARY_VEHICLES,
    tier: 3,
    icon: 'motorization_2.png',
    requiredBuildings: { researchLab: 4, trainingCenter: 4, forge: 3 },
    requiredResearch: ['motorization_1'],
    cost: { gold: 1200, metal: 800, fuel: 600 },
    researchTime: 900,
    effects: { unlocks: ['light_tank'], vehicleAttackBonus: 0.10 }
  },
  ANTI_TANK_WEAPONS: {
    id: 'anti_tank_weapons',
    name: 'Armes Antichar',
    description: 'Débloque Anti-Blindage. Lance-roquettes et armes perforantes.',
    category: RESEARCH_CATEGORIES.MILITARY_ADVANCED,
    tier: 3,
    icon: 'anti_tank_weapons.png',
    requiredBuildings: { researchLab: 5, trainingCenter: 5, forge: 2 },
    requiredResearch: ['motorization_2'],
    cost: { gold: 1500, metal: 1200, fuel: 800 },
    researchTime: 1200,
    effects: { unlocks: ['anti_armor'], antiArmorBonus: 0.30 }
  },
  HEAVY_ARMOR: {
    id: 'heavy_armor',
    name: 'Blindage Lourd',
    description: 'Débloque Tanks Lourds. Blindages ultra-résistants.',
    category: RESEARCH_CATEGORIES.MILITARY_VEHICLES,
    tier: 4,
    icon: 'heavy_armor.png',
    requiredBuildings: { researchLab: 8, trainingCenter: 8, forge: 6 },
    requiredResearch: ['motorization_2'],
    cost: { gold: 3000, metal: 2500, fuel: 2000 },
    researchTime: 2400,
    effects: { unlocks: ['heavy_tank'], vehicleDefenseBonus: 0.20 }
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
