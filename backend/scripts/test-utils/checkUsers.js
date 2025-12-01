const { User } = require('./models');
const sequelize = require('./db');

(async () => {
  try {
    const users = await User.findAll({
      limit: 5,
      attributes: ['id', 'username'],
    });

    console.log('Available users:');
    users.forEach((u) => {
      console.log(`  ID ${u.id}: ${u.username}`);
    });

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
