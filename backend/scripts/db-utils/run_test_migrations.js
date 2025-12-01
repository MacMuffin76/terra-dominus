/**
 * Script pour appliquer les migrations sur la base de test
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '.env.test') });
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  // Créer une instance Sequelize avec les variables d'environnement de test
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false
  });

  try {
    // Tester la connexion
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de test réussie');

    // Créer la table SequelizeMeta si elle n'existe pas
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
        "name" VARCHAR(255) NOT NULL PRIMARY KEY
      );
    `);

    // Lire tous les fichiers de migration
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js'))
      .sort();

    console.log(`\n📁 Trouvé ${migrationFiles.length} fichiers de migration\n`);

    // Récupérer les migrations déjà exécutées
    const [executed] = await sequelize.query(
      'SELECT name FROM "SequelizeMeta" ORDER BY name'
    );
    const executedNames = new Set(executed.map(r => r.name));

    let appliedCount = 0;
    
    // Exécuter chaque migration non encore appliquée
    for (const file of migrationFiles) {
      if (executedNames.has(file)) {
        console.log(`⏭️  ${file} (déjà appliquée)`);
        continue;
      }

      try {
        console.log(`🔄 Application de ${file}...`);
        const migration = require(path.join(migrationsDir, file));
        const queryInterface = sequelize.getQueryInterface();
        
        await migration.up(queryInterface, Sequelize);
        
        // Marquer comme exécutée
        await sequelize.query(
          'INSERT INTO "SequelizeMeta" (name) VALUES (?)',
          { replacements: [file] }
        );
        
        console.log(`✅ ${file} appliquée`);
        appliedCount++;
      } catch (error) {
        console.error(`❌ Erreur avec ${file}:`, error.message);
        throw error;
      }
    }

    console.log(`\n✅ ${appliedCount} migration(s) appliquée(s) avec succès sur terra_dominus_test`);

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigrations();
