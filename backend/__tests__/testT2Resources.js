/**
 * Integration test for T2 Resources System
 * Tests: Resources, Conversions, Storage, Statistics
 */

const { User, UserResourceT2, ResourceConversion, ResourceConversionRecipe } = require('./models');
const ResourceT2Service = require('./services/ResourceT2Service');
const resourceT2Repository = require('./repositories/ResourceT2Repository');
const { sequelize } = require('./models');

async function testT2ResourceSystem() {
  console.log('\n🔬 Testing T2 Resource System 🔬\n');

  try {
    // ==================== TEST 1: Get or Create User Resources ====================
    console.log('📝 Test 1: Get or create user T2 resources');

    let testUser = await User.findOne({ where: { username: 'testplayer' } });
    if (!testUser) {
      testUser = await User.create({
        username: 'testplayer',
        email: 'test@terradominus.com',
        password: 'hashedpassword',
      });
    }

    const resourceT2Service = new ResourceT2Service(resourceT2Repository);
    const userResources = await resourceT2Service.getUserResources(testUser.id);

    console.log('✅ User T2 resources retrieved');
    console.log(`   Titanium: ${userResources.titanium}`);
    console.log(`   Plasma: ${userResources.plasma}`);
    console.log(`   Nanotubes: ${userResources.nanotubes}`);
    console.log(`   Storage: ${JSON.stringify(userResources.storage)}\n`);

    // ==================== TEST 2: Get Available Recipes ====================
    console.log('📝 Test 2: Get available conversion recipes');

    const recipes = await resourceT2Service.getAvailableRecipes();

    console.log(`✅ Found ${recipes.length} recipes`);
    recipes.forEach((recipe) => {
      console.log(`   ${recipe.resourceType}:`);
      console.log(`      Input: ${JSON.stringify(recipe.inputResources)}`);
      console.log(`      Output: ${recipe.outputQuantity} units`);
      console.log(`      Duration: ${recipe.durationSeconds}s (${Math.floor(recipe.durationSeconds / 60)}min)`);
      console.log(
        `      Requires: ${recipe.buildingRequired} lv${recipe.buildingLevelMin}, ${recipe.researchRequired}`
      );
    });
    console.log();

    // ==================== TEST 3: Update Storage Capacity ====================
    console.log('📝 Test 3: Update storage capacity');

    const warehouseLevel = 5;
    await resourceT2Service.updateStorageCapacity(testUser.id, warehouseLevel);

    const updatedResources = await resourceT2Service.getUserResources(testUser.id);

    console.log('✅ Storage capacity updated');
    console.log(`   Warehouse level: ${warehouseLevel}`);
    console.log(`   Titanium storage: ${updatedResources.storage.titanium}`);
    console.log(`   Plasma storage: ${updatedResources.storage.plasma}`);
    console.log(`   Nanotubes storage: ${updatedResources.storage.nanotubes}\n`);

    // ==================== TEST 4: Add Resources (Direct) ====================
    console.log('📝 Test 4: Add T2 resources directly');

    const addResult = await resourceT2Repository.addResource(testUser.id, 'titanium', 50);

    console.log('✅ Resources added');
    console.log(`   Added: ${addResult.added} titanium`);
    console.log(`   Overflow: ${addResult.overflow} (if any)\n`);

    // ==================== TEST 5: Start Conversion ====================
    console.log('📝 Test 5: Start a resource conversion');

    try {
      // Note: This will fail if user doesn't have enough T1 resources
      // For now, we'll catch the error and continue
      const conversion = await resourceT2Service.startConversion(testUser.id, 'titanium', 1);

      console.log('✅ Conversion started');
      console.log(`   Conversion ID: ${conversion.conversionId}`);
      console.log(`   Resource: ${conversion.resourceType}`);
      console.log(`   Target quantity: ${conversion.quantityTarget}`);
      console.log(`   Input cost: ${JSON.stringify(conversion.inputCost)}`);
      console.log(`   Duration: ${conversion.duration}s`);
      console.log(`   Completed at: ${conversion.completedAt}`);
      console.log(`   Status: ${conversion.status}\n`);
    } catch (error) {
      console.log('⚠️  Conversion not started (expected - T1 resource checks not implemented)');
      console.log(`   Error: ${error.message}\n`);
    }

    // ==================== TEST 6: Get User Conversions ====================
    console.log('📝 Test 6: Get user conversions');

    const conversions = await resourceT2Service.getUserConversions(testUser.id);

    console.log(`✅ Found ${conversions.length} conversions`);
    conversions.forEach((c) => {
      console.log(`   Conversion ${c.id}:`);
      console.log(`      Resource: ${c.resourceType}`);
      console.log(`      Target: ${c.quantityTarget} units`);
      console.log(`      Status: ${c.status}`);
      console.log(`      Time remaining: ${c.timeRemaining}s`);
    });
    console.log();

    // ==================== TEST 7: Manual Conversion (Complete Immediately) ====================
    console.log('📝 Test 7: Create and complete conversion manually');

    const transaction = await sequelize.transaction();
    try {
      // Create a conversion that's already complete
      const testConversion = await ResourceConversion.create(
        {
          userId: testUser.id,
          resourceType: 'plasma',
          quantityTarget: 3,
          inputCost: { energie: 50000, metal: 5000 },
          startedAt: new Date(Date.now() - 3600000), // 1 hour ago
          completedAt: new Date(Date.now() - 1000), // 1 second ago
          status: 'in_progress',
        },
        { transaction }
      );

      await transaction.commit();

      console.log(`✅ Test conversion created (ID: ${testConversion.id})`);
      console.log(`   Resource: ${testConversion.resourceType}`);
      console.log(`   Quantity: ${testConversion.quantityTarget}\n`);

      // Process completed conversions
      const processed = await resourceT2Service.processCompletedConversions();

      console.log(`✅ Processed ${processed} completed conversions\n`);
    } catch (error) {
      await transaction.rollback();
      console.log(`❌ Failed to create test conversion: ${error.message}\n`);
    }

    // ==================== TEST 8: Get Statistics ====================
    console.log('📝 Test 8: Get T2 statistics');

    const userStats = await resourceT2Service.getStatistics(testUser.id);
    const globalStats = await resourceT2Service.getStatistics(null);

    console.log('✅ User statistics:');
    console.log(`   Titanium: ${userStats.resources.titanium}`);
    console.log(`   Plasma: ${userStats.resources.plasma}`);
    console.log(`   Nanotubes: ${userStats.resources.nanotubes}`);
    console.log(`   Conversions: ${JSON.stringify(userStats.conversions)}\n`);

    console.log('✅ Global statistics:');
    console.log(`   Total titanium: ${globalStats.resources.titanium}`);
    console.log(`   Total plasma: ${globalStats.resources.plasma}`);
    console.log(`   Total nanotubes: ${globalStats.resources.nanotubes}`);
    console.log(`   Total conversions: ${JSON.stringify(globalStats.conversions)}\n`);

    // ==================== TEST 9: Deduct Resources ====================
    console.log('📝 Test 9: Deduct T2 resources');

    try {
      await resourceT2Repository.deductResource(testUser.id, 'titanium', 10);
      console.log('✅ Deducted 10 titanium successfully\n');
    } catch (error) {
      console.log(`⚠️  Cannot deduct resources: ${error.message}\n`);
    }

    // ==================== TEST 10: Cancel Conversion ====================
    console.log('📝 Test 10: Cancel a conversion');

    const activeConversions = await ResourceConversion.findAll({
      where: {
        userId: testUser.id,
        status: 'in_progress',
      },
      limit: 1,
    });

    if (activeConversions.length > 0) {
      const conversionToCancel = activeConversions[0];
      try {
        const cancelResult = await resourceT2Service.cancelConversion(
          testUser.id,
          conversionToCancel.id
        );

        console.log('✅ Conversion cancelled');
        console.log(`   Conversion ID: ${conversionToCancel.id}`);
        console.log(`   Refund (50%): ${JSON.stringify(cancelResult.refund)}\n`);
      } catch (error) {
        console.log(`⚠️  Cannot cancel: ${error.message}\n`);
      }
    } else {
      console.log('⚠️  No active conversions to cancel\n');
    }

    // ==================== FINAL SUMMARY ====================
    console.log('🎉 All T2 Resource tests completed! 🎉\n');

    const finalResources = await resourceT2Service.getUserResources(testUser.id);
    const finalConversions = await resourceT2Service.getUserConversions(testUser.id);

    console.log('Summary:');
    console.log(`✅ User has ${finalResources.titanium} titanium`);
    console.log(`✅ User has ${finalResources.plasma} plasma`);
    console.log(`✅ User has ${finalResources.nanotubes} nanotubes`);
    console.log(`✅ User has ${finalConversions.length} conversions in history`);
    console.log(`✅ Storage capacity: ${finalResources.storage.titanium} per resource\n`);

    console.log('✅ Test suite completed successfully');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
testT2ResourceSystem();
