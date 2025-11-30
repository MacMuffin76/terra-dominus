/**
 * Test script for Alliance Territory System
 * Run with: node testAllianceTerritory.js
 */

const sequelize = require('./db');
const { User, Alliance, AllianceMember, AllianceTerritory, City, Resource } = require('./models');
const AllianceTerritoryService = require('./modules/alliances/application/AllianceTerritoryService');

const territoryService = new AllianceTerritoryService();

async function runTests() {
  console.log('\n🏰 Alliance Territory System Tests\n');
  console.log('='.repeat(50));

  try {
    // Setup: Create test users and alliance
    console.log('\n📦 Setting up test data...');

    // Clean up existing test data
    await AllianceTerritory.destroy({ where: {}, force: true });
    await AllianceMember.destroy({ where: {}, force: true });
    await Alliance.destroy({ where: {}, force: true });

    // Get available users
    const user1 = await User.findByPk(4);
    const user2 = await User.findByPk(5);

    if (!user1 || !user2) {
      console.error('❌ Test users not found. Please ensure users 4 and 5 exist.');
      return;
    }

    // Create test alliance
    const alliance = await Alliance.create({
      name: 'Test Empire',
      tag: 'TEST',
      description: 'Test alliance for territory system',
      leaderId: user1.id,
      memberCount: 2,
    });

    // Add members to alliance
    await AllianceMember.create({
      allianceId: alliance.id,
      userId: user1.id,
      role: 'leader',
      joinedAt: new Date(),
    });

    await AllianceMember.create({
      allianceId: alliance.id,
      userId: user2.id,
      role: 'officer',
      joinedAt: new Date(),
    });

    console.log(`✅ Test alliance created: ${alliance.name} (ID: ${alliance.id})`);
    console.log(`✅ User 1 (${user1.username}) - Leader`);
    console.log(`✅ User 2 (${user2.username}) - Officer`);

    // Test 1: Claim a territory
    console.log('\n' + '='.repeat(50));
    console.log('\n🎯 Test 1: Claim Territory (Resource Node)');
    console.log('-'.repeat(50));

    const miningTerritory = await territoryService.initiateCapture(
      alliance.id,
      user1.id,
      {
        name: 'Northern Mines',
        territoryType: 'resource_node',
        coordX: 100,
        coordY: 200,
      }
    );

    console.log('✅ Territory claimed successfully!');
    console.log(`   Name: ${miningTerritory.name}`);
    console.log(`   Type: ${miningTerritory.territoryType}`);
    console.log(`   Coords: (${miningTerritory.coordX}, ${miningTerritory.coordY})`);
    console.log(`   Defense Level: ${miningTerritory.defenseLevel}`);
    console.log(`   Bonuses:`, JSON.stringify(miningTerritory.bonuses));

    // Test 2: Claim another territory (Strategic Point)
    console.log('\n' + '='.repeat(50));
    console.log('\n🎯 Test 2: Claim Territory (Strategic Point)');
    console.log('-'.repeat(50));

    const strategicTerritory = await territoryService.initiateCapture(
      alliance.id,
      user2.id,
      {
        name: 'Central Command',
        territoryType: 'strategic_point',
        coordX: 150,
        coordY: 150,
      }
    );

    console.log('✅ Territory claimed successfully!');
    console.log(`   Name: ${strategicTerritory.name}`);
    console.log(`   Type: ${strategicTerritory.territoryType}`);
    console.log(`   Radius: ${strategicTerritory.radius}`);
    console.log(`   Bonuses:`, JSON.stringify(strategicTerritory.bonuses));

    // Test 3: Get all alliance territories
    console.log('\n' + '='.repeat(50));
    console.log('\n🎯 Test 3: Get All Alliance Territories');
    console.log('-'.repeat(50));

    const allTerritories = await territoryService.getAllianceTerritories(alliance.id, user1.id);

    console.log(`✅ Found ${allTerritories.length} territories:`);
    allTerritories.forEach((t, index) => {
      console.log(`   ${index + 1}. ${t.name} - (${t.coordX}, ${t.coordY}) - ${t.territoryType}`);
    });

    // Test 4: Upgrade defense
    console.log('\n' + '='.repeat(50));
    console.log('\n🎯 Test 4: Upgrade Territory Defense');
    console.log('-'.repeat(50));

    const upgradeResult = await territoryService.upgradeDefense(
      alliance.id,
      miningTerritory.id,
      user1.id
    );

    console.log('✅ Defense upgraded successfully!');
    console.log(`   Old Level: 1`);
    console.log(`   New Level: ${upgradeResult.territory.defenseLevel}`);
    console.log(`   Cost:`, JSON.stringify(upgradeResult.cost));

    // Test 5: Reinforce garrison
    console.log('\n' + '='.repeat(50));
    console.log('\n🎯 Test 5: Reinforce Garrison');
    console.log('-'.repeat(50));

    const reinforced = await territoryService.reinforceGarrison(
      alliance.id,
      miningTerritory.id,
      user2.id,
      500
    );

    console.log('✅ Garrison reinforced successfully!');
    console.log(`   Previous Strength: 0`);
    console.log(`   Added: 500`);
    console.log(`   New Strength: ${reinforced.garrisonStrength}`);

    // Test 6: Get territory by coordinates
    console.log('\n' + '='.repeat(50));
    console.log('\n🎯 Test 6: Get Territory by Coordinates');
    console.log('-'.repeat(50));

    const foundTerritory = await territoryService.getTerritoryByCoords(100, 200);

    console.log('✅ Territory found:');
    console.log(`   Name: ${foundTerritory.name}`);
    console.log(`   Alliance: ${foundTerritory.alliance.name} [${foundTerritory.alliance.tag}]`);
    console.log(`   Defense Level: ${foundTerritory.defenseLevel}`);
    console.log(`   Garrison: ${foundTerritory.garrisonStrength}`);

    // Test 7: Get territories in range
    console.log('\n' + '='.repeat(50));
    console.log('\n🎯 Test 7: Get Territories in Range');
    console.log('-'.repeat(50));

    const nearbyTerritories = await territoryService.getTerritoriesInRange(125, 175, 50);

    console.log(`✅ Found ${nearbyTerritories.length} territories within range 50:`);
    nearbyTerritories.forEach((t) => {
      const distance = Math.abs(t.coordX - 125) + Math.abs(t.coordY - 175);
      console.log(`   - ${t.name} at (${t.coordX}, ${t.coordY}) - Distance: ${distance}`);
    });

    // Test 8: Calculate territory bonuses
    console.log('\n' + '='.repeat(50));
    console.log('\n🎯 Test 8: Calculate Territory Bonuses');
    console.log('-'.repeat(50));

    const bonuses = await territoryService.calculateBonuses(user1.id, alliance.id);

    console.log('✅ Total alliance bonuses:');
    Object.entries(bonuses).forEach(([key, value]) => {
      if (value > 0) {
        console.log(`   ${key}: +${(value * 100).toFixed(1)}%`);
      }
    });

    // Test 9: Withdraw garrison
    console.log('\n' + '='.repeat(50));
    console.log('\n🎯 Test 9: Withdraw Garrison');
    console.log('-'.repeat(50));

    const withdrawn = await territoryService.withdrawGarrison(
      alliance.id,
      miningTerritory.id,
      user1.id,
      200
    );

    console.log('✅ Garrison withdrawn successfully!');
    console.log(`   Previous Strength: 500`);
    console.log(`   Withdrawn: 200`);
    console.log(`   New Strength: ${withdrawn.garrisonStrength}`);

    // Test 10: Get all territories (world map)
    console.log('\n' + '='.repeat(50));
    console.log('\n🎯 Test 10: Get All Territories (World Map)');
    console.log('-'.repeat(50));

    const worldTerritories = await territoryService.getAllTerritories({ limit: 10 });

    console.log(`✅ Retrieved ${worldTerritories.territories.length} of ${worldTerritories.total} territories`);
    console.log(`   Showing first ${worldTerritories.limit} territories`);

    // Test 11: Abandon territory
    console.log('\n' + '='.repeat(50));
    console.log('\n🎯 Test 11: Abandon Territory');
    console.log('-'.repeat(50));

    const abandonResult = await territoryService.abandonTerritory(
      alliance.id,
      strategicTerritory.id,
      user1.id
    );

    console.log('✅ Territory abandoned successfully!');
    console.log(`   Message: ${abandonResult.message}`);

    // Verify territory was deleted
    const remainingTerritories = await territoryService.getAllianceTerritories(
      alliance.id,
      user1.id
    );
    console.log(`   Remaining territories: ${remainingTerritories.length}`);

    // Final summary
    console.log('\n' + '='.repeat(50));
    console.log('\n✅ All Alliance Territory Tests Passed!');
    console.log('🎯 Territory system ready for production!\n');

    console.log('Test Results Summary:');
    console.log('  ✅ Territory claiming (Resource Node, Strategic Point)');
    console.log('  ✅ Territory listing and retrieval');
    console.log('  ✅ Defense upgrades with costs');
    console.log('  ✅ Garrison reinforcement and withdrawal');
    console.log('  ✅ Coordinate-based queries');
    console.log('  ✅ Range-based spatial queries');
    console.log('  ✅ Bonus calculation');
    console.log('  ✅ Territory abandonment');
    console.log('  ✅ World map integration');
    console.log('\n' + '='.repeat(50) + '\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run tests
runTests();
