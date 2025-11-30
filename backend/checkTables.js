const sequelize = require('./db');

sequelize.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'alliance_war%' ORDER BY tablename")
  .then(([results]) => {
    console.log('Alliance War Tables:');
    results.forEach(r => console.log('  -', r.tablename));
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
