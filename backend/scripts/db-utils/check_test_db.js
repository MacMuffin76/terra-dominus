const { Client } = require('pg');

async function checkAndCreateTestDB() {
  const client = new Client({
    connectionString: 'postgres://postgres:Azerty76!@localhost:5432/postgres'
  });

  try {
    await client.connect();
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname='terra_dominus_test'");
    
    if (res.rows.length === 0) {
      await client.query('CREATE DATABASE terra_dominus_test');
      console.log('✅ Base terra_dominus_test créée');
    } else {
      console.log('✅ Base terra_dominus_test existe déjà');
    }
  } catch (err) {
    console.error('❌ Erreur:', err.message);
  } finally {
    await client.end();
  }
}

checkAndCreateTestDB();
