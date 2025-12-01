const { Client } = require('pg');

async function addMissingColumns() {
  const client = new Client({
    connectionString: 'postgres://postgres:Azerty76!@localhost:5432/terra_dominus_test'
  });

  try {
    await client.connect();
    console.log('📡 Connexion à terra_dominus_test...');

    // Colonne 1: protection_shield_until
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS protection_shield_until TIMESTAMPTZ
    `);
    console.log('✅ protection_shield_until ajoutée');

    // Colonne 2: attacks_sent_count
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS attacks_sent_count INTEGER DEFAULT 0 NOT NULL
    `);
    console.log('✅ attacks_sent_count ajoutée');

    // Colonne 3: active_bonuses
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS active_bonuses JSONB DEFAULT '[]'::jsonb NOT NULL
    `);
    console.log('✅ active_bonuses ajoutée');

    console.log('\n🎉 Toutes les colonnes manquantes ont été ajoutées!');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

addMissingColumns();
