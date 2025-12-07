const axios = require('axios');

async function testAPIResponse() {
  try {
    // D'abord récupérer un token
    const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', {
      username: 'MacMuffin76',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Authentifié');

    // Maintenant tester l'API unlock/available
    const facilitiesResponse = await axios.get(
      'http://localhost:5000/api/v1/facilities/unlock/available',
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log('\n📦 Réponse de /facilities/unlock/available:');
    console.log(JSON.stringify(facilitiesResponse.data, null, 2));

    // Vérifier les champs importants
    if (facilitiesResponse.data.facilities) {
      console.log('\n🏗️  Analyse des facilities:');
      facilitiesResponse.data.facilities.forEach(f => {
        console.log(`\n${f.name}:`);
        console.log(`  - id: ${f.id}`);
        console.log(`  - level: ${f.level}`);
        console.log(`  - isLocked: ${f.isLocked}`);
        console.log(`  - lockReason: ${f.lockReason}`);
        console.log(`  - canUpgrade: ${f.canUpgrade}`);
        console.log(`  - missingResources: ${JSON.stringify(f.missingResources)}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

testAPIResponse();
