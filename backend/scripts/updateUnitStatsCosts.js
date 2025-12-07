'use strict';

const { Sequelize, QueryTypes } = require('sequelize');
const config = require('../config/database.js');

async function updateCosts() {
  const env = process.env.NODE_ENV || 'production';
  const dbConfig = config[env];
  const sequelize = new Sequelize(dbConfig.url, dbConfig);

  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    const updates = [
      { unit_id: 1037, metal: 2 + 3 + 10, gold: 1 * 10, fuel: Math.round(30 / 60) },
      { unit_id: 1038, metal: 5 + 4 + 20, gold: 1 * 10, fuel: Math.round(60 / 60) },
      { unit_id: 1039, metal: 6 + 2 + 15, gold: 1 * 10, fuel: Math.round(75 / 60) },
      { unit_id: 1040, metal: 8 + 5 + 30, gold: 2 * 10, fuel: Math.round(120 / 60) },
      { unit_id: 1041, metal: 6 + 8 + 25, gold: 2 * 10, fuel: Math.round(90 / 60) },
      { unit_id: 1042, metal: 12 + 2 + 15, gold: 2 * 10, fuel: Math.round(180 / 60) },
      { unit_id: 1043, metal: 3 + 4 + 20, gold: 2 * 10, fuel: Math.round(150 / 60) },
      { unit_id: 1044, metal: 20 + 18 + 100, gold: 3 * 10, fuel: Math.round(300 / 60) },
      { unit_id: 1045, metal: 15 + 10 + 30, gold: 3 * 10, fuel: Math.round(240 / 60) },
      { unit_id: 1046, metal: 25 + 8 + 40, gold: 3 * 10, fuel: Math.round(600 / 60) },
      { unit_id: 1048, metal: 35 + 30 + 200, gold: 4 * 10, fuel: Math.round(1800 / 60) },
      { unit_id: 1049, metal: 40 + 5 + 60, gold: 4 * 10, fuel: Math.round(3600 / 60) },
      { unit_id: 1050, metal: 1 + 1 + 5, gold: 2 * 10, fuel: Math.round(300 / 60) },
    ];

    for (const update of updates) {
      await sequelize.query(
        'UPDATE unit_stats SET base_cost_metal = :metal, base_cost_gold = :gold, base_cost_fuel = :fuel WHERE unit_id = :unit_id',
        {
          replacements: update,
          type: QueryTypes.UPDATE,
        }
      );
      console.log(`Updated costs for unit_id ${update.unit_id}`);
    }

    console.log('All costs updated successfully.');
  } catch (error) {
    console.error('Unable to connect to the database or update costs:', error);
  } finally {
    await sequelize.close();
  }
}

updateCosts();
