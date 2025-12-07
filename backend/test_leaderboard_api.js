require('dotenv').config();
const axios = require('axios');
const { User } = require('./models');

async function testLeaderboardAPI() {
  try {
    // Récupérer un utilisateur pour obtenir son token
    const user = await User.findOne();
    if (!user) {
      console.log('❌ Aucun utilisateur trouvé');
      process.exit(1);
    }

    console.log(`Testing with user: ${user.username}\n`);

    // Générer un token (ou utiliser un existant)
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '1h' }
    );

    // Tester l'endpoint leaderboard
    const response = await axios.get('http://localhost:5000/api/v1/leaderboards/total_power', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        limit: 10,
        offset: 0
      }
    });

    console.log('=== Réponse API ===');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
    process.exit(1);
  }
}

testLeaderboardAPI();
