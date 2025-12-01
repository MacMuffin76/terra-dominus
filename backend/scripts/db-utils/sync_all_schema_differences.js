const { Client } = require('pg');

async function syncAllTables() {
  const prodClient = new Client({ connectionString: 'postgres://postgres:Azerty76!@localhost:5432/terra_dominus' });
  const testClient = new Client({ connectionString: 'postgres://postgres:Azerty76!@localhost:5432/terra_dominus_test' });

  try {
    await prodClient.connect();
    await testClient.connect();
    console.log('📡 Connecté aux deux bases');

    // Get all tables
    const tablesResult = await prodClient.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    const tables = tablesResult.rows.map(r => r.tablename);
    console.log(`\n📊 ${tables.length} tables à comparer\n`);

    let totalChanges = 0;

    for (const table of tables) {
      // Get columns from production
      const prodCols = await prodClient.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [table]);

      // Get columns from test
      const testCols = await testClient.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [table]);

      const prodColNames = new Set(prodCols.rows.map(r => r.column_name));
      const testColNames = new Set(testCols.rows.map(r => r.column_name));

      const missing = prodCols.rows.filter(c => !testColNames.has(c.column_name));

      if (missing.length > 0) {
        console.log(`\n🔧 Table: ${table}`);
        console.log(`   Colonnes manquantes: ${missing.length}`);
        
        for (const col of missing) {
          try {
            // Build ALTER TABLE statement
            let dataType = col.data_type.toUpperCase();
            if (dataType === 'CHARACTER VARYING') dataType = 'VARCHAR';
            if (dataType === 'TIMESTAMP WITHOUT TIME ZONE') dataType = 'TIMESTAMP';
            if (dataType === 'TIMESTAMP WITH TIME ZONE') dataType = 'TIMESTAMPTZ';
            
            let alterStmt = `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col.column_name} ${dataType}`;
            
            if (col.is_nullable === 'NO' && col.column_default) {
              alterStmt += ` DEFAULT ${col.column_default} NOT NULL`;
            } else if (col.column_default) {
              alterStmt += ` DEFAULT ${col.column_default}`;
            } else if (col.is_nullable === 'NO') {
              // Can't add NOT NULL without default on existing table, skip NOT NULL
              alterStmt += ` NULL`;
            }

            await testClient.query(alterStmt);
            console.log(`   ✅ ${col.column_name} (${dataType})`);
            totalChanges++;
          } catch (err) {
            console.log(`   ❌ ${col.column_name}: ${err.message}`);
          }
        }
      }
    }

    console.log(`\n🎉 Synchronisation terminée: ${totalChanges} colonnes ajoutées`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  } finally {
    await prodClient.end();
    await testClient.end();
  }
}

syncAllTables();
