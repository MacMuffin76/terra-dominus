const axios = require('axios');

// Remplace par ton token JWT valide
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzMzMzQyOTQyLCJleHAiOjE3MzM5NDc3NDJ9.lWjY6iDJqzQmLY4nEqHKAyVCGLRZlmTrVAHxPZMcVCk';

async function testBuildingDetails() {
  try {
    // Récupérer les bâtiments de ressources
    console.log('\n=== Récupération des bâtiments de ressources ===');
    const buildingsRes = await axios.get('http://localhost:5000/api/v1/resources/resource-buildings', {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    
    console.log(`Nombre de bâtiments: ${buildingsRes.data.length}`);
    
    // Trouver "Mine de métal"
    const mineMetalBuilding = buildingsRes.data.find(b => b.name === 'Mine de métal');
    
    if (mineMetalBuilding) {
      console.log(`\nMine de métal trouvée:`, {
        id: mineMetalBuilding.id,
        name: mineMetalBuilding.name,
        level: mineMetalBuilding.level
      });

      // Récupérer les détails
      console.log('\n=== Détails de Mine de métal ===');
      const detailRes = await axios.get(`http://localhost:5000/api/v1/resources/resource-buildings/${mineMetalBuilding.id}`, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });

      const detail = detailRes.data;
      console.log(`Niveau actuel: ${detail.level}`);
      console.log(`Production actuelle: ${Math.floor(detail.production_rate * 3600)}/h`);
      console.log(`Production niveau suivant: ${Math.floor(detail.next_production_rate * 3600)}/h`);
      console.log(`Durée de construction: ${detail.buildDuration}s`);
      console.log(`Coûts pour niveau ${detail.level + 1}:`);
      detail.nextLevelCost.forEach(cost => {
        console.log(`  - ${cost.resource_type}: ${cost.amount}`);
      });
    } else {
      console.log('\n⚠️ Mine de métal non trouvée');
    }

    // Tester aussi avec un Extracteur
    const extracteur = buildingsRes.data.find(b => b.name === 'Extracteur');
    if (extracteur) {
      console.log(`\n=== Détails de Extracteur (niveau ${extracteur.level}) ===`);
      const detailRes = await axios.get(`http://localhost:5000/api/v1/resources/resource-buildings/${extracteur.id}`, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });

      const detail = detailRes.data;
      console.log(`Production actuelle: ${Math.floor(detail.production_rate * 3600)}/h`);
      console.log(`Production niveau suivant: ${Math.floor(detail.next_production_rate * 3600)}/h`);
      console.log(`Coûts pour niveau ${detail.level + 1}:`);
      detail.nextLevelCost.forEach(cost => {
        console.log(`  - ${cost.resource_type}: ${cost.amount}`);
      });
    }

  } catch (error) {
    if (error.response) {
      console.error('Erreur API:', error.response.status, error.response.data);
    } else {
      console.error('Erreur:', error.message);
    }
  }
}

testBuildingDetails();
