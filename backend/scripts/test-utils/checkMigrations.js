const sequelize = require('./db');

sequelize.query('SELECT * FROM "SequelizeMeta" ORDER BY name')
  .then(([results]) => {
    console.log('Migrations executed:');
    results.forEach(r => console.log('  -', r.name));
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
