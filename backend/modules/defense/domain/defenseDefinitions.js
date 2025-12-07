/**
 * Defense Definitions
 * Défenses disponibles avec leurs caractéristiques, coûts et prérequis
 */

const DEFENSE_DEFINITIONS = {
  MACHINE_GUN_TURRET: {
    id: 'machine_gun_turret',
    name: 'Tourelle Mitrailleuse',
    description: 'Défense anti-infanterie automatique.',
    cost: { gold: 100 },
    requiredBuildings: { defenseWorkshop: 1 },
    requiredResearch: [],
    tier: 1
  },
  REINFORCED_WALLS: {
    id: 'reinforced_walls',
    name: 'Murs Renforcés',
    description: 'Ralentit les attaquants et absorbe les dégâts.',
    cost: { gold: 150 },
    requiredBuildings: { defenseWorkshop: 1 },
    requiredResearch: [],
    tier: 1
  },
  ANTI_VEHICLE_TURRET: {
    id: 'anti_vehicle_turret',
    name: 'Tourelle Anti-Véhicule',
    description: 'Canon anti-blindage léger à longue portée.',
    cost: { gold: 200 },
    requiredBuildings: { defenseWorkshop: 3 },
    requiredResearch: ['targeting_systems'],
    tier: 2
  },
  ELECTRIC_TRAPS: {
    id: 'electric_traps',
    name: 'Pièges Électriques',
    description: 'Défense de zone qui immobilise et électrocute.',
    cost: { gold: 80, energy: 100 },
    requiredBuildings: { defenseWorkshop: 3 },
    requiredResearch: ['energy_efficiency'],
    tier: 2
  },
  ANTI_TANK_CANNON: {
    id: 'anti_tank_cannon',
    name: 'Canon Anti-Tank',
    description: 'Artillerie lourde pour détruire les blindés.',
    cost: { gold: 450 },
    requiredBuildings: { defenseWorkshop: 5 },
    requiredResearch: ['anti_armor_weapons'],
    tier: 3
  },
  FORTIFIED_BUNKER: {
    id: 'fortified_bunker',
    name: 'Bunker Fortifié',
    description: 'Point de résistance qui abrite des troupes.',
    cost: { gold: 400 },
    requiredBuildings: { defenseWorkshop: 5 },
    requiredResearch: ['fortifications'],
    tier: 3
  },
  ENERGY_SHIELD: {
    id: 'energy_shield',
    name: 'Bouclier Énergétique',
    description: 'Protection de zone qui réduit les dégâts à distance.',
    cost: { gold: 600, energy: 800 },
    requiredBuildings: { defenseWorkshop: 10 },
    requiredResearch: ['energy_shields'],
    tier: 4
  },
  PLASMA_TURRET: {
    id: 'plasma_turret',
    name: 'Tourelle Plasma',
    description: 'Défense à énergie avancée, équilibrée contre toutes unités.',
    cost: { gold: 500, energy: 400 },
    requiredBuildings: { defenseWorkshop: 8 },
    requiredResearch: ['energy_weapons', 'power_plant_5'],
    tier: 4
  }
};

module.exports = {
  DEFENSE_DEFINITIONS
};
