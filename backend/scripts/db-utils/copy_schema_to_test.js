/**
 * Script pour copier le schéma de la base de production vers la base de test
 */
const { Client } = require('pg');

async function copySchema() {
  const prodClient = new Client({
    connectionString: 'postgres://postgres:Azerty76!@localhost:5432/terra_dominus'
  });
  
  const testClient = new Client({
    connectionString: 'postgres://postgres:Azerty76!@localhost:5432/terra_dominus_test'
  });

  try {
    console.log('📡 Connexion aux deux bases de données...');
    await prodClient.connect();
    await testClient.connect();
    console.log('✅ Connecté');

    console.log('\n📊 Export du schéma de production...');
    const { rows: tables } = await prodClient.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%' AND tablename NOT LIKE 'sql_%'
      ORDER BY tablename
    `);

    console.log(`Trouvé ${tables.length} tables à copier`);

    // Nettoyer la base de test
    console.log('\n🧹 Nettoyage de la base de test...');
    await testClient.query('DROP SCHEMA public CASCADE;');
    await testClient.query('CREATE SCHEMA public;');
    await testClient.query('GRANT ALL ON SCHEMA public TO postgres;');
    await testClient.query('GRANT ALL ON SCHEMA public TO public;');
    
    console.log('✅ Base de test nettoyée');

    // Exporter le schéma complet avec pg_dump aurait été plus simple
    // mais nous allons recréer juste les tables vides
    
    for (const { tablename } of tables) {
      console.log(`📋 Copie de la structure de ${tablename}...`);
      
      // Obtenir le CREATE TABLE de la table de production
      const { rows: [{ create_stmt }] } = await prodClient.query(`
        SELECT 
          'CREATE TABLE ' || quote_ident(tablename) || ' (' ||
          array_to_string(
            array_agg(
              quote_ident(attname) || ' ' || 
              pg_catalog.format_type(atttypid, atttypmod) ||
              CASE WHEN attnotnull THEN ' NOT NULL' ELSE '' END ||
              CASE WHEN atthasdef THEN ' DEFAULT ' || pg_get_expr(adbin, adrelid) ELSE '' END
            ),
            ', '
          ) || ');' as create_stmt
        FROM pg_attribute a
        LEFT JOIN pg_attrdef d ON (a.attrelid, a.attnum) = (d.adrelid, d.adnum)
        JOIN pg_class c ON a.attrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
          AND c.relname = $1
          AND a.attnum > 0
          AND NOT a.attisdropped
        GROUP BY tablename
      `, [tablename]);

      try {
        await testClient.query(create_stmt);
        console.log(`✅ ${tablename} créée`);
      } catch (err) {
        console.log(`⚠️  Erreur avec ${tablename}: ${err.message}`);
      }
    }

    console.log('\n✅ Schéma copié avec succès vers terra_dominus_test');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prodClient.end();
    await testClient.end();
  }
}

copySchema();
