// Test crafting models loading
const sequelize = require('./db');

console.log('Loading User model...');
const User = require('./models/User');
console.log('✅ User loaded:', User.name);

console.log('\nLoading crafting models...');
const BlueprintCrafting = require('./models/Blueprint')(sequelize);
const PlayerBlueprint = require('./models/PlayerBlueprint')(sequelize);
const CraftingQueue = require('./models/CraftingQueue')(sequelize);
const PlayerCraftingStats = require('./models/PlayerCraftingStats')(sequelize);

console.log('✅ BlueprintCrafting:', BlueprintCrafting.name);
console.log('✅ PlayerBlueprint:', PlayerBlueprint.name);
console.log('✅ CraftingQueue:', CraftingQueue.name);
console.log('✅ PlayerCraftingStats:', PlayerCraftingStats.name);

console.log('\nSetting up associations...');
const models = {
  User,
  BlueprintCrafting,
  PlayerBlueprint,
  CraftingQueue,
  PlayerCraftingStats
};

console.log('Models object keys:', Object.keys(models));

// Test associations
if (BlueprintCrafting.associate) {
  console.log('Calling BlueprintCrafting.associate...');
  BlueprintCrafting.associate(models);
}

if (PlayerBlueprint.associate) {
  console.log('Calling PlayerBlueprint.associate...');
  console.log('models.User:', models.User);
  console.log('models.BlueprintCrafting:', models.BlueprintCrafting);
  PlayerBlueprint.associate(models);
}

if (CraftingQueue.associate) {
  console.log('Calling CraftingQueue.associate...');
  CraftingQueue.associate(models);
}

if (PlayerCraftingStats.associate) {
  console.log('Calling PlayerCraftingStats.associate...');
  PlayerCraftingStats.associate(models);
}

console.log('\n✅ All associations completed successfully!');
process.exit(0);
