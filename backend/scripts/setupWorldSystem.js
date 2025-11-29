#!/usr/bin/env node

/**
 * Script de configuration rapide du système World pour Terra Dominus
 * 
 * Usage: node backend/scripts/setupWorldSystem.js
 */

const sequelize = require('../db');
const { generateWorldMap } = require('./generateWorldMap');
const City = require('../models/City');
const WorldGrid = require('../models/WorldGrid');
const CitySlot = require('../models/CitySlot');
const Entity = require('../models/Entity');
const ResourceCost = require('../models/ResourceCost');
const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'SetupWorldSystem' });

async function setupWorldSystem() {
  try {
    logger.info('=== CONFIGURATION DU SYSTÈME WORLD ===');

    // 1. Vérifier la connexion DB
    logger.info('1. Vérification de la connexion à la base de données...');
    await sequelize.authenticate();
    logger.info('✓ Connexion établie');

    // 2. Générer la carte si elle n'existe pas
    logger.info('2. Vérification de la carte du monde...');
    const gridCount = await WorldGrid.count();
    
    if (gridCount === 0) {
      logger.info('   Carte non trouvée, génération en cours...');
      await generateWorldMap();
      logger.info('✓ Carte générée');
    } else {
      logger.info(`✓ Carte existante (${gridCount} cases)`);
    }

    // 3. Créer l'unité Colon
    logger.info('3. Configuration de l\'unité Colon...');
    let colonEntity = await Entity.findOne({
      where: { name: 'Colon', entity_type: 'unit' },
    });

    if (!colonEntity) {
      colonEntity = await Entity.create({
        entity_type: 'unit',
        name: 'Colon',
        description: 'Unité de colonisation permettant de fonder de nouvelles villes',
      });

      // Coûts de formation
      await ResourceCost.bulkCreate([
        {
          entity_id: colonEntity.entity_id,
          level: 1,
          resource_type: 'or',
          amount: 2000,
        },
        {
          entity_id: colonEntity.entity_id,
          level: 1,
          resource_type: 'metal',
          amount: 1500,
        },
        {
          entity_id: colonEntity.entity_id,
          level: 1,
          resource_type: 'carburant',
          amount: 1000,
        },
      ]);

      logger.info('✓ Unité Colon créée');
    } else {
      logger.info('✓ Unité Colon existe déjà');
    }

    // 4. Créer les technologies de colonisation
    logger.info('4. Configuration des technologies de colonisation...');
    const techs = [
      { name: 'Colonisation I', desc: 'Permet de fonder jusqu\'à 2 villes', cost: 5000 },
      { name: 'Colonisation II', desc: 'Permet de fonder jusqu\'à 3 villes', cost: 10000 },
      { name: 'Colonisation III', desc: 'Permet de fonder jusqu\'à 5 villes', cost: 25000 },
      { name: 'Empire Étendu', desc: 'Permet de fonder jusqu\'à 10 villes', cost: 50000 },
      { name: 'Domination Totale', desc: 'Permet de fonder jusqu\'à 20 villes', cost: 100000 },
      { name: 'Cartographie', desc: 'Augmente le rayon de vision de +2', cost: 3000 },
      { name: 'Éclaireurs', desc: 'Augmente le rayon de vision de +3', cost: 8000 },
      { name: 'Cartographie avancée', desc: 'Augmente le rayon de vision de +5', cost: 15000 },
    ];

    for (const tech of techs) {
      const existing = await Entity.findOne({
        where: { name: tech.name, entity_type: 'research' },
      });

      if (!existing) {
        const entity = await Entity.create({
          entity_type: 'research',
          name: tech.name,
          description: tech.desc,
        });

        await ResourceCost.create({
          entity_id: entity.entity_id,
          level: 1,
          resource_type: 'or',
          amount: tech.cost,
        });

        logger.info(`  ✓ ${tech.name} créée`);
      }
    }

    logger.info('✓ Technologies configurées');

    // 5. Attribuer des coordonnées aux villes existantes sans coordonnées
    logger.info('5. Mise à jour des villes existantes...');
    const citiesWithoutCoords = await City.findAll({
      where: {
        coord_x: null,
      },
    });

    if (citiesWithoutCoords.length > 0) {
      logger.info(`   ${citiesWithoutCoords.length} villes sans coordonnées trouvées`);

      // Récupérer des slots libres
      const freeSlots = await CitySlot.findAll({
        where: { status: 'free' },
        include: [
          {
            model: WorldGrid,
            as: 'grid',
            attributes: ['coord_x', 'coord_y'],
          },
        ],
        limit: citiesWithoutCoords.length,
      });

      if (freeSlots.length < citiesWithoutCoords.length) {
        logger.warn(`   Seulement ${freeSlots.length} slots disponibles pour ${citiesWithoutCoords.length} villes`);
      }

      for (let i = 0; i < Math.min(citiesWithoutCoords.length, freeSlots.length); i++) {
        const city = citiesWithoutCoords[i];
        const slot = freeSlots[i];

        await city.update({
          coord_x: slot.grid.coord_x,
          coord_y: slot.grid.coord_y,
        });

        await slot.update({
          status: 'occupied',
          city_id: city.id,
        });

        logger.info(`  ✓ ${city.name} → (${slot.grid.coord_x}, ${slot.grid.coord_y})`);
      }

      logger.info('✓ Villes mises à jour');
    } else {
      logger.info('✓ Toutes les villes ont déjà des coordonnées');
    }

    // 6. Statistiques finales
    logger.info('6. Statistiques du système:');
    const stats = {
      tiles: await WorldGrid.count(),
      slots: await CitySlot.count(),
      freeSlots: await CitySlot.count({ where: { status: 'free' } }),
      occupiedSlots: await CitySlot.count({ where: { status: 'occupied' } }),
      cities: await City.count(),
    };

    logger.info(`   Cases totales: ${stats.tiles}`);
    logger.info(`   Emplacements de villes: ${stats.slots}`);
    logger.info(`   Libres: ${stats.freeSlots}`);
    logger.info(`   Occupés: ${stats.occupiedSlots}`);
    logger.info(`   Villes existantes: ${stats.cities}`);

    logger.info('');
    logger.info('=== CONFIGURATION TERMINÉE AVEC SUCCÈS ===');
    logger.info('');
    logger.info('Prochaines étapes:');
    logger.info('1. Démarrez le backend: npm run start');
    logger.info('2. Démarrez le worker: npm run worker');
    logger.info('3. Démarrez le frontend: cd ../frontend && npm run start');
    logger.info('4. Accédez à la carte: http://localhost:3000/world');
    logger.info('');

  } catch (error) {
    logger.error('Erreur lors de la configuration:', error);
    throw error;
  }
}

// Exécution
if (require.main === module) {
  setupWorldSystem()
    .then(() => {
      logger.info('Script terminé');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Le script a échoué:', error);
      process.exit(1);
    });
}

module.exports = { setupWorldSystem };
