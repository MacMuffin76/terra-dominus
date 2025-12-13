const createContainer = require('./container');

(async () => {
  try {
    const container = createContainer();
    const productionCalculatorService = container.resolve('productionCalculatorService');
    
    console.log('🧪 Test ProductionCalculatorService pour user 95\n');
    
    const rates = await productionCalculatorService.calculateProductionRates(95);
    
    console.log('📊 Résultats:');
    console.log('Production par seconde:');
    console.log('  - Or:', rates.production.gold, '/s');
    console.log('  - Métal:', rates.production.metal, '/s');
    console.log('  - Carburant:', rates.production.fuel, '/s');
    console.log('  - Énergie:', rates.production.energy, '/s');
    
    console.log('\nProduction par heure:');
    console.log('  - Or:', (rates.production.gold * 3600).toFixed(2), '/h');
    console.log('  - Métal:', (rates.production.metal * 3600).toFixed(2), '/h');
    console.log('  - Carburant:', (rates.production.fuel * 3600).toFixed(2), '/h');
    console.log('  - Énergie:', (rates.production.energy * 3600).toFixed(2), '/h');
    
    console.log('\nStockage:');
    console.log('  - Or:', rates.storage.gold);
    console.log('  - Métal:', rates.storage.metal);
    console.log('  - Carburant:', rates.storage.fuel);
    console.log('  - Énergie:', rates.storage.energy);
    
    console.log('\nBonus:');
    console.log(rates.bonuses);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
