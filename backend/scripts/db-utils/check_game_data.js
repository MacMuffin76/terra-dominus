require('dotenv').config({ path: '.env.test' });
const { sequelize } = require('./models');
const { Client } = require('pg');

async function checkGameData() {
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    });
    await client.connect();

    const entities = await client.query('SELECT COUNT(*) FROM entities');
    const blueprints = await client.query('SELECT COUNT(*) FROM blueprints');
    const units = await client.query('SELECT COUNT(*) FROM units');
    const resources = await client.query('SELECT COUNT(*) FROM resources');

    console.log('📊 Données de jeu de base:');
    console.log(`  Entités (buildings/resources): ${entities.rows[0].count}`);
    console.log(`  Blueprints: ${blueprints.rows[0].count}`);
    console.log(`  Unités: ${units.rows[0].count}`);
    console.log(`  Ressources: ${resources.rows[0].count}`);

    if (entities.rows[0].count === '0') {
      console.log('\n❌ PROBLÈME: Aucune entité de base! Les tests ne peuvent pas créer de villes.');
    } else {
      console.log('\n✅ Données de base présentes');
    }

    await client.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkGameData();
