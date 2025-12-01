const db = require('../db');
const container = require('../container');
const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'ForceResourceUpdate' });

async function forceResourceUpdate(userId) {
  try {
    await db.authenticate();
    logger.info('Database connected');

    const resourceService = container.resolve('resourceService');
    
    console.log(`\n🔄 Mise à jour des ressources pour l'utilisateur ${userId}...\n`);
    
    const before = await resourceService.getUserResources(userId);
    
    console.log('=== RESSOURCES AVANT ===');
    before.forEach(r => {
      console.log(`${r.type}: ${r.amount} (production: ${r.production_rate}/s, niveau: ${r.level})`);
    });

    // Attendre 2 secondes
    await new Promise(resolve => setTimeout(resolve, 2000));

    const after = await resourceService.getUserResources(userId);
    
    console.log('\n=== RESSOURCES APRÈS (2 secondes) ===');
    after.forEach(r => {
      const before_r = before.find(b => b.type === r.type);
      const diff = r.amount - before_r.amount;
      console.log(`${r.type}: ${r.amount} (${diff >= 0 ? '+' : ''}${diff.toFixed(2)}, production: ${r.production_rate}/s)`);
    });

    console.log('\n✅ Mise à jour terminée');
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Update failed');
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

const userId = process.argv[2] || 1;
forceResourceUpdate(parseInt(userId));
