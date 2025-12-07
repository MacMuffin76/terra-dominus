const axios = require('axios');

(async () => {
  try {
    // Simuler une requête authentifiée (remplacez par votre token JWT)
    const response = await axios.get('http://localhost:5000/api/v1/dashboard', {
      headers: {
        'Authorization': 'Bearer VOTRE_TOKEN_ICI' // À remplacer
      }
    });

    console.log('📊 Réponse de /api/v1/dashboard:\n');
    console.log('Facilities:', response.data.facilities?.length || 0);
    console.log('Researches:', response.data.researches?.length || 0);
    console.log('\nRecherches retournées:');
    response.data.researches?.forEach(r => {
      console.log(`  - ${r.name} (niv.${r.level})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n💡 Pour tester manuellement:');
    console.log('1. Ouvrez votre navigateur');
    console.log('2. Ouvrez DevTools (F12) > Onglet Network');
    console.log('3. Rechargez la page du dashboard');
    console.log('4. Cherchez la requête "dashboard" et vérifiez la réponse');
  }
  
  process.exit(0);
})();
