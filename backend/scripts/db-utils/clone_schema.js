const { Client } = require('pg');
const fs = require('fs');

async function cloneSchema() {
  const prodClient = new Client({ connectionString: 'postgres://postgres:Azerty76!@localhost:5432/terra_dominus' });
  const testClient = new Client({ connectionString: 'postgres://postgres:Azerty76!@localhost:5432/postgres' });

  try {
    await prodClient.connect();
    await testClient.connect();
    console.log('📡 Connecté');

    // 1. Drop and recreate test database
    console.log('\n🗑️  Drop terra_dominus_test...');
    await testClient.query('DROP DATABASE IF EXISTS terra_dominus_test');
    
    console.log('🆕 Create terra_dominus_test...');
    await testClient.query('CREATE DATABASE terra_dominus_test');
    
    await testClient.end();
    
    // 2. Connect to new test database
    const newTestClient = new Client({ connectionString: 'postgres://postgres:Azerty76!@localhost:5432/terra_dominus_test' });
    await newTestClient.connect();
    
    // 3. Get complete schema dump from production
    console.log('\n📥 Extraction du schéma production...');
    
    // Get all CREATE TABLE statements
    const tablesQuery = await prodClient.query(`
      SELECT 
        'CREATE TABLE ' || tablename || ' (' ||
        string_agg(
          column_name || ' ' || data_type ||
          CASE 
            WHEN character_maximum_length IS NOT NULL 
            THEN '(' || character_maximum_length || ')'
            ELSE ''
          END ||
          CASE 
            WHEN is_nullable = 'NO' THEN ' NOT NULL'
            ELSE ''
          END ||
          CASE 
            WHEN column_default IS NOT NULL 
            THEN ' DEFAULT ' || column_default
            ELSE ''
          END,
          ', '
          ORDER BY ordinal_position
        ) || ');' as create_stmt
      FROM information_schema.columns
      WHERE table_schema = 'public'
      GROUP BY tablename
      ORDER BY tablename
    `);

    console.log(`\n🏗️  Création de ${tablesQuery.rows.length} tables...`);
    
    for (const row of tablesQuery.rows) {
      try {
        await newTestClient.query(row.create_stmt);
        const tableName = row.create_stmt.match(/CREATE TABLE (\w+)/)[1];
        console.log(`   ✅ ${tableName}`);
      } catch (err) {
        console.log(`   ❌ ${row.create_stmt.substring(0, 50)}...: ${err.message.substring(0, 100)}`);
      }
    }

    // 4. Get and apply indexes
    console.log('\n📊 Copie des indexes...');
    const indexesQuery = await prodClient.query(`
      SELECT indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `);
    
    for (const row of indexesQuery.rows) {
      try {
        await newTestClient.query(row.indexdef);
      } catch (err) {
        // Ignore primary key indexes (already created)
        if (!err.message.includes('already exists')) {
          console.log(`   ⚠️  ${err.message.substring(0, 80)}`);
        }
      }
    }

    // 5. Get and apply foreign keys
    console.log('\n🔗 Copie des contraintes de clés étrangères...');
    const fkeysQuery = await prodClient.query(`
      SELECT 
        'ALTER TABLE ' || tc.table_name || 
        ' ADD CONSTRAINT ' || tc.constraint_name || 
        ' FOREIGN KEY (' || kcu.column_name || ') ' ||
        'REFERENCES ' || ccu.table_name || '(' || ccu.column_name || ')' ||
        CASE 
          WHEN rc.delete_rule = 'CASCADE' THEN ' ON DELETE CASCADE'
          WHEN rc.delete_rule = 'SET NULL' THEN ' ON DELETE SET NULL'
          ELSE ''
        END as fkey_stmt
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      LEFT JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
    `);
    
    let fkeyCount = 0;
    for (const row of fkeysQuery.rows) {
      try {
        await newTestClient.query(row.fkey_stmt);
        fkeyCount++;
      } catch (err) {
        console.log(`   ⚠️  ${err.message.substring(0, 80)}`);
      }
    }
    console.log(`   ✅ ${fkeyCount} contraintes ajoutées`);

    console.log('\n🎉 Schéma cloné avec succès!');

    await prodClient.end();
    await newTestClient.end();

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

cloneSchema();
