/**
 * Règles et constantes du domaine World
 */

// Rayon de vision par défaut d'une ville
const DEFAULT_VISION_RANGE = 5;

// Bonus de vision par niveau de technologie
const TECH_VISION_BONUS = {
  'Cartographie': 2,
  'Éclaireurs': 3,
  'Cartographie avancée': 5,
};

// Bonus de ressources par type de terrain
const TERRAIN_BONUSES = {
  plains: {
    description: 'Plaines fertiles',
    bonuses: { or: 1.0, metal: 1.0, carburant: 1.0, energie: 1.0 },
  },
  forest: {
    description: 'Forêt dense',
    bonuses: { or: 0.8, metal: 0.9, carburant: 1.2, energie: 1.0 },
  },
  mountain: {
    description: 'Montagnes',
    bonuses: { or: 1.1, metal: 1.4, carburant: 0.9, energie: 1.1 },
  },
  hills: {
    description: 'Collines',
    bonuses: { or: 1.0, metal: 1.2, carburant: 1.0, energie: 1.0 },
  },
  desert: {
    description: 'Désert aride',
    bonuses: { or: 0.9, metal: 0.8, carburant: 1.3, energie: 1.2 },
  },
  water: {
    description: 'Eau',
    bonuses: { or: 0, metal: 0, carburant: 0, energie: 0 },
  },
};

/**
 * Calcule la distance de Manhattan entre deux points
 */
function calculateDistance(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * Calcule le temps de voyage entre deux points
 * @param distance - Distance en cases
 * @param baseSpeed - Vitesse de base (cases par heure)
 * @returns Durée en secondes
 */
function calculateTravelTime(distance, baseSpeed = 2) {
  const hours = distance / baseSpeed;
  return Math.ceil(hours * 3600); // Convertir en secondes
}

/**
 * Détermine toutes les cases dans le rayon de vision d'un point
 * @returns Array de coordonnées {x, y}
 */
function getVisibleTilesFromPoint(centerX, centerY, visionRange) {
  const tiles = [];

  for (let dy = -visionRange; dy <= visionRange; dy++) {
    for (let dx = -visionRange; dx <= visionRange; dx++) {
      // Distance de Manhattan
      if (Math.abs(dx) + Math.abs(dy) <= visionRange) {
        tiles.push({
          x: centerX + dx,
          y: centerY + dy,
        });
      }
    }
  }

  return tiles;
}

/**
 * Calcule le rayon de vision total d'un joueur
 */
function calculateVisionRange(baseRange, researches = []) {
  let totalRange = baseRange;

  researches.forEach((research) => {
    if (TECH_VISION_BONUS[research.name]) {
      totalRange += TECH_VISION_BONUS[research.name];
    }
  });

  return totalRange;
}

/**
 * Détermine si une coordonnée est valide sur la carte
 */
function isValidCoordinate(x, y, maxX, maxY) {
  return x >= 0 && x < maxX && y >= 0 && y < maxY;
}

/**
 * Obtient le bonus de production d'un terrain pour une ressource
 */
function getTerrainBonus(terrainType, resourceType) {
  const terrain = TERRAIN_BONUSES[terrainType];
  if (!terrain || !terrain.bonuses[resourceType]) {
    return 1.0; // Pas de bonus
  }
  return terrain.bonuses[resourceType];
}

/**
 * Calcule le coût en ressources pour coloniser un emplacement
 */
function getColonizationCost(distance, quality) {
  const baseCost = {
    or: 5000,
    metal: 3000,
    carburant: 2000,
  };

  // Coût augmente avec la distance et diminue avec la qualité
  const distanceMultiplier = 1 + (distance / 50);
  const qualityMultiplier = 1 / (quality * 0.2 + 0.6); // Quality 1-5

  return {
    or: Math.floor(baseCost.or * distanceMultiplier * qualityMultiplier),
    metal: Math.floor(baseCost.metal * distanceMultiplier * qualityMultiplier),
    carburant: Math.floor(baseCost.carburant * distanceMultiplier * qualityMultiplier),
  };
}

module.exports = {
  DEFAULT_VISION_RANGE,
  TECH_VISION_BONUS,
  TERRAIN_BONUSES,
  calculateDistance,
  calculateTravelTime,
  getVisibleTilesFromPoint,
  calculateVisionRange,
  isValidCoordinate,
  getTerrainBonus,
  getColonizationCost,
};
