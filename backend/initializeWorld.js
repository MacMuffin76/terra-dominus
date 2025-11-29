/**
 * Script pour initialiser la grille du monde
 * Génère une carte de 100x100 avec des emplacements de villes aléatoires
 */

const sequelize = require('./db');
const { WorldGrid, CitySlot } = require('./models');
const { getLogger } = require('./utils/logger');

const logger = getLogger({ module: 'InitializeWorld' });
const WORLD_SIZE = 100; // Grille de 100x100
const CITY_SLOTS_COUNT = 500; // 500 emplacements de villes possibles

async function initializeWorldGrid() {
  logger.info('Initialisation de la grille du monde');
  
  try {
    // Vérifier si la grille existe déjà
    const existingTiles = await WorldGrid.count();
    if (existingTiles > 0) {
      logger.info({ existingTiles }, 'La grille existe déjà. Aucune action nécessaire');
      return;
    }

    logger.info({ totalTiles: WORLD_SIZE * WORLD_SIZE }, 'Génération des tiles');
    
    const tiles = [];
    const terrainTypes = ['plains', 'forest', 'mountain', 'desert', 'water'];
    
    // Générer toutes les tiles
    for (let x = 0; x < WORLD_SIZE; x++) {
      for (let y = 0; y < WORLD_SIZE; y++) {
        // Terrain aléatoire avec probabilités
        const rand = Math.random();
        let terrain;
        if (rand < 0.4) terrain = 'plains';
        else if (rand < 0.6) terrain = 'forest';
        else if (rand < 0.75) terrain = 'mountain';
        else if (rand < 0.85) terrain = 'desert';
        else terrain = 'water';
        
        tiles.push({
          coord_x: x,
          coord_y: y,
          terrain_type: terrain,
          has_city_slot: false,
        });
      }
    }

    // Insérer par batch de 1000 pour éviter les timeouts
    logger.info('Insertion des tiles par batch');
    const batchSize = 1000;
    for (let i = 0; i < tiles.length; i += batchSize) {
      const batch = tiles.slice(i, i + batchSize);
      await WorldGrid.bulkCreate(batch);
      logger.debug({ progress: Math.min(i + batchSize, tiles.length), total: tiles.length }, 'Progression insertion');
    }

    logger.info('Grille générée avec succès');

    // Générer les emplacements de villes
    console.log(`\n🏙️  Génération de ${CITY_SLOTS_COUNT} emplacements de villes...`);
    
    // Sélectionner des tiles non-water aléatoirement
    const landTiles = await WorldGrid.findAll({
      where: {
        terrain_type: { [sequelize.Sequelize.Op.ne]: 'water' }
      },
      order: sequelize.literal('RANDOM()'),
      limit: CITY_SLOTS_COUNT,
    });

    // Marquer ces tiles comme ayant un city_slot
    const citySlotTileIds = landTiles.map(t => t.id);
    await WorldGrid.update(
      { has_city_slot: true },
      { where: { id: citySlotTileIds } }
    );

    // Créer les city_slots
    const citySlots = landTiles.map(tile => ({
      grid_id: tile.id,
      status: 'free',
      city_id: null,
    }));

    await CitySlot.bulkCreate(citySlots);

    logger.info('Emplacements de villes générés avec succès');
    logger.info({
      tiles: WORLD_SIZE * WORLD_SIZE,
      citySlots: CITY_SLOTS_COUNT
    }, 'Initialisation terminée');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Exécuter le script
initializeWorldGrid()
  .then(() => {
    logger.info('Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    logger.error({ err: error }, 'Erreur fatale');
    process.exit(1);
  });
