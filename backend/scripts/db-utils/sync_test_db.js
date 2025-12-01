/**
 * Script pour synchroniser la base de test (créer toutes les tables)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '.env.test') });

// Import après avoir chargé .env.test  
const sequelize = require('./db.js');

// Importer tous les modèles pour qu'ils soient enregistrés
require('./models');

async function syncDatabase() {
  try {
    console.log('🔄 Connexion à la base de test...');
    await sequelize.authenticate();
    console.log('✅ Connexion réussie');

    console.log('\n🔄 Nettoyage de la base...');
    // Supprimer toutes les tables en désactivant les contraintes
    await sequelize.query('DROP SCHEMA public CASCADE;');
    await sequelize.query('CREATE SCHEMA public;');
    await sequelize.query('GRANT ALL ON SCHEMA public TO postgres;');
    await sequelize.query('GRANT ALL ON SCHEMA public TO public;');
    
    console.log('✅ Base nettoyée');
    
    console.log('\n🔄 Synchronisation des modèles...');
    await sequelize.sync({ force: false });
    
    console.log('\n✅ Base de données terra_dominus_test synchronisée avec succès');
    console.log('📊 Toutes les tables ont été créées');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur lors de la synchronisation:', error.message);
    console.error(error.stack);
    await sequelize.close();
    process.exit(1);
  }
}

syncDatabase();
