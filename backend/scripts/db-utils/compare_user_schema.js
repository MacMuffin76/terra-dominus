const { Client } = require('pg');

async function compare() {
  // Production
  console.log('=== PRODUCTION (terra_dominus) ===');
  const prodClient = new Client({
    connectionString: 'postgres://postgres:Azerty76!@localhost:5432/terra_dominus'
  });
  await prodClient.connect();
  const prodResult = await prodClient.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name='users' 
    ORDER BY ordinal_position
  `);
  prodResult.rows.forEach(r => console.log(`${r.column_name.padEnd(30)} | ${r.data_type.padEnd(20)} | ${r.is_nullable}`));
  await prodClient.end();

  console.log('\n=== TEST (terra_dominus_test) ===');
  const testClient = new Client({
    connectionString: 'postgres://postgres:Azerty76!@localhost:5432/terra_dominus_test'
  });
  await testClient.connect();
  const testResult = await testClient.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name='users' 
    ORDER BY ordinal_position
  `);
  testResult.rows.forEach(r => console.log(`${r.column_name.padEnd(30)} | ${r.data_type.padEnd(20)} | ${r.is_nullable}`));
  await testClient.end();

  // Différences
  console.log('\n=== DIFFÉRENCES ===');
  const prodCols = new Set(prodResult.rows.map(r => r.column_name));
  const testCols = new Set(testResult.rows.map(r => r.column_name));
  
  const missing = [...prodCols].filter(c => !testCols.has(c));
  const extra = [...testCols].filter(c => !prodCols.has(c));
  
  if (missing.length) {
    console.log('\nManquantes dans TEST:', missing.join(', '));
  }
  if (extra.length) {
    console.log('En trop dans TEST:', extra.join(', '));
  }
  if (!missing.length && !extra.length) {
    console.log('Aucune différence dans les colonnes');
  }
}

compare().catch(console.error);
