const { Client } = require('pg');

async function check() {
  const client = new Client({
    connectionString: 'postgres://postgres:Azerty76!@localhost:5432/terra_dominus_test'
  });

  try {
    await client.connect();
    
    const tables = await client.query(`
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`\n📊 Tables dans terra_dominus_test: ${tables.rows[0].count}`);
    
    const users = await client.query('SELECT COUNT(*) FROM users');
    console.log(`👥 Utilisateurs: ${users.rows[0].count}`);
    
    const cities = await client.query('SELECT COUNT(*) FROM cities');
    console.log(`🏙️  Villes: ${cities.rows[0].count}`);
    
    console.log('\n✅ Base test opérationnelle');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
  }
}

check();
