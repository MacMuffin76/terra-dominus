require('dotenv').config();
const { Building } = require('./models');
const { getProductionPerSecond } = require('./utils/balancing');

async function checkProduction() {
  const cityId = 86;
  
  const buildings = await Building.findAll({ where: { city_id: cityId } });
  
  const productionBuildings = buildings.filter(b => 
    ['Mine d\'or', 'Mine de métal', 'Extracteur', 'Centrale électrique'].includes(b.name)
  );
  
  console.log('\n=== Bâtiments de production ===');
  productionBuildings.forEach(b => {
    const prod = getProductionPerSecond(b.name, b.level);
    console.log(`${b.name} niveau ${b.level}: ${prod}/s`);
  });
  
  // Calculer le temps écoulé depuis last_update
  const lastUpdate = new Date('2025-12-04T21:24:59.392Z');
  const now = new Date();
  const elapsedSeconds = Math.floor((now - lastUpdate) / 1000);
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  
  console.log('\n=== Temps écoulé ===');
  console.log(`Dernière mise à jour: ${lastUpdate.toLocaleString('fr-FR')}`);
  console.log(`Maintenant: ${now.toLocaleString('fr-FR')}`);
  console.log(`Temps écoulé: ${elapsedMinutes} minutes (${elapsedSeconds} secondes)`);
  
  // Calculer production attendue
  const goldMine = productionBuildings.find(b => b.name === 'Mine d\'or');
  const metalMine = productionBuildings.find(b => b.name === 'Mine de métal');
  const extractor = productionBuildings.find(b => b.name === 'Extracteur');
  const powerPlant = productionBuildings.find(b => b.name === 'Centrale électrique');
  
  const goldPerSec = goldMine ? getProductionPerSecond(goldMine.name, goldMine.level) : 0;
  const metalPerSec = metalMine ? getProductionPerSecond(metalMine.name, metalMine.level) : 0;
  const fuelPerSec = extractor ? getProductionPerSecond(extractor.name, extractor.level) : 0;
  
  console.log('\n=== Production attendue ===');
  console.log(`Or: 895 + ${Math.floor(goldPerSec * elapsedSeconds)} = ${895 + Math.floor(goldPerSec * elapsedSeconds)}`);
  console.log(`Métal: 1206 + ${Math.floor(metalPerSec * elapsedSeconds)} = ${1206 + Math.floor(metalPerSec * elapsedSeconds)}`);
  console.log(`Carburant: 10 + ${Math.floor(fuelPerSec * elapsedSeconds)} = ${10 + Math.floor(fuelPerSec * elapsedSeconds)}`);
  
  process.exit();
}

checkProduction().catch(console.error);
