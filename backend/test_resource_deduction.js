const sequelize = require('./db');
const { getLogger } = require('./utils/logger');

const logger = getLogger({ module: 'TestResourceDeduction' });

async function testResourceDeduction() {
  try {
    const cityId = 1; // Ajustez selon votre ID de ville
    
    logger.info('Fetching resources...');
    const [resources] = await sequelize.query(`
      SELECT id, city_id, type, amount FROM resources WHERE city_id = :cityId ORDER BY type;
    `, { replacements: { cityId } });

    console.log('\nRessources AVANT:');
    resources.forEach(r => console.log(`  ${r.type}: ${r.amount}`));

    // Mapper les types de ressources
    const mapping = {
      'gold': 'or',
      'metal': 'metal',
      'fuel': 'carburant',
      'energy': 'energie'
    };

    const testCost = {
      gold: 800,
      metal: 500,
      fuel: 300,
      energy: 100
    };

    console.log('\nCoûts à déduire:');
    Object.entries(testCost).forEach(([type, cost]) => {
      const mappedType = mapping[type];
      console.log(`  ${type} (${mappedType}): ${cost}`);
    });

    // Test de la transaction
    await sequelize.transaction(async (transaction) => {
      for (const [resourceType, cost] of Object.entries(testCost)) {
        const mappedType = mapping[resourceType];
        const resource = resources.find(r => r.type === mappedType);
        
        if (!resource) {
          console.log(`  ❌ Resource ${mappedType} not found!`);
          continue;
        }

        console.log(`  Déduisant ${cost} de ${mappedType} (actuellement: ${resource.amount})`);
        
        const newAmount = resource.amount - cost;
        await sequelize.query(`
          UPDATE resources SET amount = :newAmount WHERE id = :id;
        `, { 
          replacements: { newAmount, id: resource.id },
          transaction 
        });

        resource.amount = newAmount;
      }

      console.log('\nRessources APRÈS (dans transaction):');
      resources.forEach(r => console.log(`  ${r.type}: ${r.amount}`));

      // Rollback pour ne pas vraiment modifier
      throw new Error('TEST ROLLBACK - pas de vraie modification');
    });

  } catch (error) {
    if (error.message === 'TEST ROLLBACK - pas de vraie modification') {
      console.log('\n✅ Test terminé - transaction rollback (normal)');
    } else {
      logger.error({ err: error }, 'Error in test');
    }
  } finally {
    process.exit(0);
  }
}

testResourceDeduction();
