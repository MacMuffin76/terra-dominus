const sequelize = require('./db');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion DB OK\n');

    // Lister toutes les tables qui pourraient contenir les recherches
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%research%'
      ORDER BY table_name
    `);
    
    console.log('📋 Tables contenant "research":\n');
    tables.forEach(t => console.log(`  - ${t.table_name}`));

    // Vérifier research_types ou technology_tree
    console.log('\n🔍 Contenu de research_types (si existe):');
    try {
      const [researchTypes] = await sequelize.query('SELECT * FROM research_types LIMIT 5');
      console.log(`  Trouvées: ${researchTypes.length} entrées`);
      researchTypes.forEach(r => console.log(`  - ${r.name || r.title}`));
    } catch (e) {
      console.log('  Table research_types n\'existe pas');
    }

    // Vérifier technologies
    console.log('\n🔍 Contenu de technologies (si existe):');
    try {
      const [techs] = await sequelize.query('SELECT * FROM technologies LIMIT 5');
      console.log(`  Trouvées: ${techs.length} entrées`);
      techs.forEach(t => console.log(`  - ${t.name || t.title}`));
    } catch (e) {
      console.log('  Table technologies n\'existe pas');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
})();
