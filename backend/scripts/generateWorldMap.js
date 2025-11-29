/**
 * Script de génération de la carte du monde
 * Génère une grille avec emplacements de villes et types de terrain variés
 * 
 * Usage: node backend/scripts/generateWorldMap.js
 */

const sequelize = require('../db');
const WorldGrid = require('../models/WorldGrid');
const CitySlot = require('../models/CitySlot');
const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'WorldMapGenerator' });

// Configuration de la carte
const CONFIG = {
  WORLD_SIZE_X: 100,
  WORLD_SIZE_Y: 100,
  CITY_SLOTS_COUNT: 300, // Nombre d'emplacements de villes
  MIN_CITY_DISTANCE: 8, // Distance minimale entre deux emplacements de villes
  
  // Distribution des terrains (en pourcentage)
  TERRAIN_DISTRIBUTION: {
    plains: 40,
    forest: 25,
    mountain: 15,
    hills: 10,
    desert: 7,
    water: 3,
  },
};

/**
 * Calcule la distance de Manhattan entre deux points
 */
function manhattanDistance(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * Vérifie si une position est assez éloignée des emplacements de villes existants
 */
function isValidCityPosition(x, y, existingPositions, minDistance) {
  for (const pos of existingPositions) {
    if (manhattanDistance(x, y, pos.x, pos.y) < minDistance) {
      return false;
    }
  }
  return true;
}

/**
 * Génère des positions aléatoires pour les emplacements de villes
 */
function generateCityPositions(sizeX, sizeY, count, minDistance) {
  const positions = [];
  const maxAttempts = count * 50; // Limite de tentatives pour éviter boucle infinie
  let attempts = 0;

  while (positions.length < count && attempts < maxAttempts) {
    const x = Math.floor(Math.random() * sizeX);
    const y = Math.floor(Math.random() * sizeY);

    if (isValidCityPosition(x, y, positions, minDistance)) {
      positions.push({ x, y });
    }
    attempts++;
  }

  if (positions.length < count) {
    logger.warn(
      `Seulement ${positions.length}/${count} emplacements de villes générés après ${maxAttempts} tentatives`
    );
  }

  return positions;
}

/**
 * Sélectionne un type de terrain aléatoire basé sur la distribution
 */
function getRandomTerrainType() {
  const rand = Math.random() * 100;
  let cumulative = 0;

  for (const [terrain, percentage] of Object.entries(CONFIG.TERRAIN_DISTRIBUTION)) {
    cumulative += percentage;
    if (rand <= cumulative) {
      return terrain;
    }
  }

  return 'plains'; // Par défaut
}

/**
 * Applique un lissage pour créer des zones de terrain cohérentes
 * (Évite le terrain complètement aléatoire case par case)
 */
function smoothTerrain(terrainMap, sizeX, sizeY, iterations = 2) {
  for (let iter = 0; iter < iterations; iter++) {
    const newMap = Array(sizeY).fill(null).map(() => Array(sizeX).fill(null));

    for (let y = 0; y < sizeY; y++) {
      for (let x = 0; x < sizeX; x++) {
        const neighbors = [];
        
        // Récupère les voisins (4-connectivity)
        if (x > 0) neighbors.push(terrainMap[y][x - 1]);
        if (x < sizeX - 1) neighbors.push(terrainMap[y][x + 1]);
        if (y > 0) neighbors.push(terrainMap[y - 1][x]);
        if (y < sizeY - 1) neighbors.push(terrainMap[y + 1][x]);

        // Compte les occurrences de chaque type
        const counts = {};
        neighbors.forEach((terrain) => {
          counts[terrain] = (counts[terrain] || 0) + 1;
        });

        // Si la majorité des voisins sont du même type, adopte ce type
        const dominantTerrain = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])[0]?.[0];

        if (dominantTerrain && counts[dominantTerrain] >= 3) {
          newMap[y][x] = dominantTerrain;
        } else {
          newMap[y][x] = terrainMap[y][x];
        }
      }
    }

    terrainMap = newMap;
  }

  return terrainMap;
}

/**
 * Génère la carte du monde
 */
async function generateWorldMap() {
  try {
    logger.info('Début de la génération de la carte du monde...');

    // Vérifier si la carte existe déjà
    const existingCount = await WorldGrid.count();
    if (existingCount > 0) {
      logger.warn(`La carte existe déjà (${existingCount} cases). Voulez-vous la régénérer ?`);
      logger.warn('Pour régénérer, supprimez d\'abord les données avec: TRUNCATE TABLE world_grid CASCADE;');
      return;
    }

    const { WORLD_SIZE_X, WORLD_SIZE_Y, CITY_SLOTS_COUNT, MIN_CITY_DISTANCE } = CONFIG;

    // Étape 1: Générer les positions des emplacements de villes
    logger.info(`Génération de ${CITY_SLOTS_COUNT} emplacements de villes...`);
    const cityPositions = generateCityPositions(
      WORLD_SIZE_X,
      WORLD_SIZE_Y,
      CITY_SLOTS_COUNT,
      MIN_CITY_DISTANCE
    );
    logger.info(`${cityPositions.length} emplacements générés`);

    // Créer un Set pour recherche rapide
    const cityPosSet = new Set(cityPositions.map((p) => `${p.x},${p.y}`));

    // Étape 2: Générer la carte de terrain initiale
    logger.info('Génération de la carte de terrain...');
    let terrainMap = Array(WORLD_SIZE_Y)
      .fill(null)
      .map(() =>
        Array(WORLD_SIZE_X)
          .fill(null)
          .map(() => getRandomTerrainType())
      );

    // Étape 3: Lisser le terrain pour créer des zones cohérentes
    logger.info('Lissage du terrain...');
    terrainMap = smoothTerrain(terrainMap, WORLD_SIZE_X, WORLD_SIZE_Y, 2);

    // Étape 4: Créer les cases de la grille en batch
    logger.info('Création des cases de la grille...');
    const gridData = [];
    
    for (let y = 0; y < WORLD_SIZE_Y; y++) {
      for (let x = 0; x < WORLD_SIZE_X; x++) {
        const hasCitySlot = cityPosSet.has(`${x},${y}`);
        
        // Les emplacements de villes ne sont jamais sur l'eau
        let terrainType = terrainMap[y][x];
        if (hasCitySlot && terrainType === 'water') {
          terrainType = 'plains';
        }

        gridData.push({
          coord_x: x,
          coord_y: y,
          terrain_type: terrainType,
          has_city_slot: hasCitySlot,
        });
      }
    }

    await WorldGrid.bulkCreate(gridData, { validate: true });
    logger.info(`${gridData.length} cases créées`);

    // Étape 5: Créer les CitySlots pour les cases marquées
    logger.info('Création des emplacements de villes...');
    const citySlotData = [];

    // Récupérer les IDs des cases avec city_slot
    const citySlotGrids = await WorldGrid.findAll({
      where: { has_city_slot: true },
      attributes: ['id', 'coord_x', 'coord_y', 'terrain_type'],
    });

    for (const grid of citySlotGrids) {
      // Déterminer la qualité de l'emplacement basée sur le terrain
      let quality = 3; // Qualité moyenne par défaut
      
      switch (grid.terrain_type) {
        case 'plains':
          quality = 4; // Excellent pour agriculture/production
          break;
        case 'forest':
          quality = 3; // Bon pour ressources bois
          break;
        case 'mountain':
          quality = 3; // Bon pour métal/défense
          break;
        case 'hills':
          quality = 3; // Équilibré
          break;
        case 'desert':
          quality = 2; // Moins favorable
          break;
      }

      // Ajouter variation aléatoire ±1
      quality = Math.max(1, Math.min(5, quality + (Math.random() > 0.5 ? 1 : -1)));

      citySlotData.push({
        grid_id: grid.id,
        status: 'free',
        quality,
      });
    }

    await CitySlot.bulkCreate(citySlotData, { validate: true });
    logger.info(`${citySlotData.length} emplacements de villes créés`);

    // Statistiques finales
    logger.info('=== GÉNÉRATION TERMINÉE ===');
    logger.info(`Taille de la carte: ${WORLD_SIZE_X}x${WORLD_SIZE_Y}`);
    logger.info(`Cases totales: ${WORLD_SIZE_X * WORLD_SIZE_Y}`);
    logger.info(`Emplacements de villes: ${citySlotData.length}`);
    
    const terrainStats = {};
    gridData.forEach((cell) => {
      terrainStats[cell.terrain_type] = (terrainStats[cell.terrain_type] || 0) + 1;
    });
    logger.info('Distribution des terrains:', terrainStats);

  } catch (error) {
    logger.error('Erreur lors de la génération de la carte:', error);
    throw error;
  }
}

// Exécution du script si appelé directement
if (require.main === module) {
  generateWorldMap()
    .then(() => {
      logger.info('Script terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Le script a échoué:', error);
      process.exit(1);
    });
}

module.exports = { generateWorldMap };
