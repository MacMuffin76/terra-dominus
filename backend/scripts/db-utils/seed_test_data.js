require('dotenv').config({ path: '.env.test' });
const { sequelize } = require('./models');
const { Client } = require('pg');

async function seedTestData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🔌 Connecté à la base test');

    // Vérifier les données existantes
    const entitiesCount = await client.query('SELECT COUNT(*) FROM entities');
    const blueprintsCount = await client.query('SELECT COUNT(*) FROM blueprints');
    
    console.log(`📊 État actuel:`);
    console.log(`  - Entités: ${entitiesCount.rows[0].count}`);
    console.log(`  - Blueprints: ${blueprintsCount.rows[0].count}`);

    // Les tests utilisent des fallbacks pour les unités, pas besoin de blueprints
    // Les entités (33) suffisent pour la création d'utilisateurs
    
    if (parseInt(entitiesCount.rows[0].count) > 0) {
      console.log('✅ Données de base suffisantes pour les tests');
    } else {
      console.log('❌ Entités manquantes - extraction nécessaire');
    }

    await client.end();
    console.log('✅ Vérification terminée');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

seedTestData();
