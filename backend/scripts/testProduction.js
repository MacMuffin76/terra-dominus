const { getProductionPerSecond } = require('../utils/balancing');

console.log('\n=== TAUX DE PRODUCTION ===\n');

console.log('Mine d\'or niveau 4:', getProductionPerSecond('Mine d\'or', 4), 'par seconde');
console.log('Mine d\'or niveau 4:', (getProductionPerSecond('Mine d\'or', 4) * 60).toFixed(2), 'par minute');
console.log('Mine d\'or niveau 4:', (getProductionPerSecond('Mine d\'or', 4) * 3600).toFixed(2), 'par heure');

console.log('\nMine de métal niveau 4:', getProductionPerSecond('Mine de métal', 4), 'par seconde');
console.log('Mine de métal niveau 4:', (getProductionPerSecond('Mine de métal', 4) * 60).toFixed(2), 'par minute');
console.log('Mine de métal niveau 4:', (getProductionPerSecond('Mine de métal', 4) * 3600).toFixed(2), 'par heure');

console.log('\nExtracteur niveau 1:', getProductionPerSecond('Extracteur', 1), 'par seconde');
console.log('Extracteur niveau 1:', (getProductionPerSecond('Extracteur', 1) * 60).toFixed(2), 'par minute');
console.log('Extracteur niveau 1:', (getProductionPerSecond('Extracteur', 1) * 3600).toFixed(2), 'par heure');

console.log('\n=== TEST SUR 1 MINUTE ===\n');
const oneMinute = 60;
console.log('En 1 minute, Mine d\'or lvl 4 produit:', (getProductionPerSecond('Mine d\'or', 4) * oneMinute).toFixed(2), 'or');
console.log('En 1 minute, Mine de métal lvl 4 produit:', (getProductionPerSecond('Mine de métal', 4) * oneMinute).toFixed(2), 'métal');
