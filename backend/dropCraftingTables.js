const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  logging: false
});

async function dropTables() {
  try {
    await sequelize.query('DROP TABLE IF EXISTS player_crafting_stats CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS crafting_queue CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS player_blueprints CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS blueprints CASCADE');
    console.log(' Tables dropped successfully');
    process.exit(0);
  } catch (error) {
    console.error(' Error:', error.message);
    process.exit(1);
  }
}

dropTables();
