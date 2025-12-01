const db = require('../db');
const City = require('../models/City');
const Building = require('../models/Building');
const Entity = require('../models/Entity');
const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'AddMissingResourceBuildings' });

const RESOURCE_BUILDINGS = [
  "Mine d'or",
  'Mine de métal',
  'Extracteur',
  'Centrale électrique',
  'Hangar',
  'Réservoir',
];

// Map building names to entity names (entities don't have accents)
const BUILDING_TO_ENTITY_MAP = {
  "Mine d'or": "Mine d'or",
  'Mine de métal': 'Mine de metal',
  'Extracteur': 'Extracteur',
  'Centrale électrique': 'Centrale electrique',
  'Hangar': 'Hangar',
  'Réservoir': 'Reservoir',
};

async function addMissingResourceBuildings() {
  try {
    await db.authenticate();
    logger.info('Database connected');

    // Get all building entities
    const entities = await Entity.findAll({
      where: {
        entity_type: 'building',
      },
    });

    const entityMap = new Map();
    entities.forEach(entity => {
      entityMap.set(entity.entity_name, entity.entity_id);
    });

    logger.info({ entityCount: entities.length }, 'Loaded building entities');

    const cities = await City.findAll();
    logger.info({ cityCount: cities.length }, 'Found cities');

    let totalAdded = 0;

    for (const city of cities) {
      const existingBuildings = await Building.findAll({
        where: { city_id: city.id },
        attributes: ['name'],
      });

      const existingNames = existingBuildings.map(b => b.name);
      const missingBuildings = RESOURCE_BUILDINGS.filter(name => !existingNames.includes(name));

      if (missingBuildings.length > 0) {
        logger.info(
          { cityId: city.id, cityName: city.name, missingBuildings },
          'Adding missing resource buildings'
        );

        for (const buildingName of missingBuildings) {
          const entityName = BUILDING_TO_ENTITY_MAP[buildingName];
          const entityId = entityMap.get(entityName);
          
          if (!entityId) {
            logger.warn({ buildingName, entityName }, 'Entity not found for building, skipping');
            continue;
          }

          await Building.create({
            city_id: city.id,
            name: buildingName,
            level: 0, // Start at level 0 (not built yet)
            building_type_id: entityId,
          });
          totalAdded++;
        }
      }
    }

    logger.info({ totalAdded }, 'Migration complete - Missing resource buildings added');
    console.log(`✅ Migration terminée : ${totalAdded} bâtiments ajoutés`);
    
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Migration failed');
    console.error('❌ Erreur lors de la migration :', error.message);
    process.exit(1);
  }
}

addMissingResourceBuildings();
