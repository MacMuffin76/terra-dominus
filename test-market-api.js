// Script de test pour vérifier l'API Market
const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';

// Remplacez ce token par un vrai token JWT de votre application
const TEST_TOKEN = 'VOTRE_TOKEN_JWT_ICI';

async function testMarketAPI() {
  console.log('🧪 Test de l\'API Market...\n');

  try {
    // Test 1: Récupérer les ordres actifs (sans auth devrait échouer)
    console.log('1️⃣ Test GET /market/orders (sans auth)');
    try {
      const response = await axios.get(`${API_URL}/market/orders`);
      console.log('❌ Erreur: Devrait exiger l\'authentification');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Protection auth OK (401 Unauthorized)');
      } else {
        console.log('⚠️ Erreur inattendue:', error.message);
      }
    }

    // Test 2: Avec authentification (si vous avez un token)
    if (TEST_TOKEN !== 'VOTRE_TOKEN_JWT_ICI') {
      console.log('\n2️⃣ Test GET /market/orders (avec auth)');
      try {
        const response = await axios.get(`${API_URL}/market/orders`, {
          headers: { Authorization: `Bearer ${TEST_TOKEN}` }
        });
        console.log('✅ API répond:', response.data.length, 'ordres trouvés');
      } catch (error) {
        console.log('❌ Erreur:', error.response?.data?.message || error.message);
      }

      console.log('\n3️⃣ Test GET /market/stats/metal');
      try {
        const response = await axios.get(`${API_URL}/market/stats/metal`, {
          headers: { Authorization: `Bearer ${TEST_TOKEN}` }
        });
        console.log('✅ Stats reçues:', response.data);
      } catch (error) {
        console.log('❌ Erreur:', error.response?.data?.message || error.message);
      }
    } else {
      console.log('\n⚠️ Configurez TEST_TOKEN pour tester avec authentification');
    }

    console.log('\n✅ Tests terminés');
  } catch (error) {
    console.error('❌ Erreur globale:', error.message);
  }
}

testMarketAPI();
