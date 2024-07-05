const sequelize = require('./db');
const Defense = require('./models/Defense');

const syncDB = async () => {
  try {
    await sequelize.sync({ alter: true }); // 'alter' met à jour les tables existantes pour correspondre au modèle
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing the database:', error);
  } finally {
    await sequelize.close();
  }
};

syncDB();
