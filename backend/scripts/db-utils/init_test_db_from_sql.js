/**
 * Script pour appliquer init_terra_dominus.sql sur la base de test
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function initTestDB() {
  const client = new Client({
    connectionString: 'postgres://postgres:Azerty76!@localhost:5432/terra_dominus_test'
  });

  try {
    console.log('📡 Connexion à terra_dominus_test...');
    await client.connect();
    console.log('✅ Connecté');

    console.log('\n📄 Lecture du fichier init_terra_dominus.sql...');
    const sqlPath = path.join(__dirname, '..', 'scripts', 'init_terra_dominus.sql');
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Fichier init_terra_dominus.sql non trouvé dans ${sqlPath}`);
    }
    
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    console.log(`✅ Fichier lu (${sql.length} caractères)`);

    console.log('\n🔄 Exécution du SQL...');
    await client.query(sql);
    
    console.log('\n✅ Base de données test initialisée avec succès!');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initTestDB();
