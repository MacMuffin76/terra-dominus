const createContainer = require('./container');
const createCraftingRouter = require('./routes/craftingRoutes');
const express = require('express');

console.log('🔍 Testing Crafting System Integration...\n');

try {
  // Test container
  const container = createContainer();
  console.log('✅ Container created successfully');

  // Test crafting controller resolution
  const craftingController = container.resolve('craftingController');
  console.log('✅ CraftingController resolved');
  console.log('   Controller methods:', Object.keys(craftingController).length);

  // Test crafting service resolution
  const craftingService = container.resolve('craftingService');
  console.log('✅ CraftingService resolved');
  console.log('   Service methods:', Object.keys(craftingService).filter(k => !k.startsWith('_')).length);

  // Test crafting repository resolution
  const craftingRepository = container.resolve('craftingRepository');
  console.log('✅ CraftingRepository resolved');
  console.log('   Repository models loaded:', !!craftingRepository.Blueprint && !!craftingRepository.CraftingQueue);

  // Test crafting routes
  const craftingRouter = createCraftingRouter(craftingController);
  console.log('✅ Crafting routes created');
  
  // Test mounting routes on Express app
  const app = express();
  app.use('/api/v1/crafting', craftingRouter);
  console.log('✅ Crafting routes mounted successfully');

  console.log('\n🎉 All crafting system components integrated successfully!\n');
  console.log('API Endpoints available at:');
  console.log('  GET    /api/v1/crafting/blueprints');
  console.log('  GET    /api/v1/crafting/blueprints/:id');
  console.log('  GET    /api/v1/crafting/user-blueprints');
  console.log('  POST   /api/v1/crafting/user-blueprints/:blueprintId/grant');
  console.log('  POST   /api/v1/crafting/craft');
  console.log('  GET    /api/v1/crafting/queue');
  console.log('  DELETE /api/v1/crafting/queue/:id');
  console.log('  POST   /api/v1/crafting/queue/:id/speedup');
  console.log('  POST   /api/v1/crafting/queue/:id/collect');
  console.log('  GET    /api/v1/crafting/stats');
  console.log('  GET    /api/v1/crafting/leaderboard');

  process.exit(0);
} catch (error) {
  console.error('❌ Integration test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
