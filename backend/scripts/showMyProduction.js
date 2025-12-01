const { getProductionPerSecond } = require('../utils/balancing');

console.log('Production par seconde avec vos niveaux:');
console.log('Mine d\'or niveau 8:', getProductionPerSecond('Mine d\'or', 8).toFixed(4), '/s');
console.log('Mine de métal niveau 2:', getProductionPerSecond('Mine de métal', 2).toFixed(4), '/s');
console.log('Extracteur niveau 3:', getProductionPerSecond('Extracteur', 3).toFixed(4), '/s');

console.log('\nProduction par minute:');
console.log('Or:', (getProductionPerSecond('Mine d\'or', 8) * 60).toFixed(2), '/min');
console.log('Métal:', (getProductionPerSecond('Mine de métal', 2) * 60).toFixed(2), '/min');
console.log('Carburant:', (getProductionPerSecond('Extracteur', 3) * 60).toFixed(2), '/min');
