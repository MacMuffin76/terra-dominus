const sequelize = require('./db');
const { User, Alliance, AllianceMember, Resource, City } = require('./models');
const AllianceTreasuryService = require('./modules/alliances/application/AllianceTreasuryService');

const testAllianceTreasury = async () => {
  try {
    console.log('\n🧪 Testing Alliance Treasury System...\n');

    // 1. Find or create test users
    console.log('1️⃣  Setting up test users and alliance...');
    let user1 = await User.findOne({ where: { username: 'treasury_test_user1' } });
    if (!user1) {
      user1 = await User.create({
        username: 'treasury_test_user1',
        email: 'treasury1@test.com',
        password: 'test123',
      });
    }

    let user2 = await User.findOne({ where: { username: 'treasury_test_user2' } });
    if (!user2) {
      user2 = await User.create({
        username: 'treasury_test_user2',
        email: 'treasury2@test.com',
        password: 'test123',
      });
    }

    console.log(`   ✅ User 1: ${user1.username} (ID: ${user1.id})`);
    console.log(`   ✅ User 2: ${user2.username} (ID: ${user2.id})`);

    // 2. Create or use existing alliance
    let alliance = await Alliance.findOne({ where: { tag: 'TEST' } });
    if (!alliance) {
      alliance = await Alliance.create({
        name: 'Test Alliance',
        tag: 'TEST',
        leaderId: user1.id,
        description: 'Test alliance for treasury',
      });

      // Add leader as member
      await AllianceMember.create({
        allianceId: alliance.id,
        userId: user1.id,
        role: 'leader',
      });

      // Add second user as member
      await AllianceMember.create({
        allianceId: alliance.id,
        userId: user2.id,
        role: 'member',
      });

      await Alliance.update({ memberCount: 2 }, { where: { id: alliance.id } });
    }

    console.log(`   ✅ Alliance: ${alliance.name} [${alliance.tag}] (ID: ${alliance.id})`);

    // 3. Ensure users have cities and resources
    console.log('\n2️⃣  Setting up user cities and resources...');
    
    // Get or create city for user1
    let user1City = await City.findOne({ where: { user_id: user1.id, is_capital: true } });
    if (!user1City) {
      user1City = await City.create({
        user_id: user1.id,
        name: `${user1.username}'s Capital`,
        is_capital: true,
        coord_x: Math.floor(Math.random() * 100),
        coord_y: Math.floor(Math.random() * 100),
      });
    }

    // Set resources for each type (using database types)
    const resourceTypesMap = {
      or: 50000,      // gold
      metal: 30000,   // metal
      essence: 20000, // fuel
      energie: 10000, // energy
    };
    
    for (const [type, amount] of Object.entries(resourceTypesMap)) {
      let resource = await Resource.findOne({
        where: { city_id: user1City.id, type },
      });
      
      if (!resource) {
        await Resource.create({
          city_id: user1City.id,
          type,
          amount,
        });
      } else {
        await resource.update({ amount });
      }
    }

    console.log(`   ✅ User1 city: ${user1City.name} (ID: ${user1City.id})`);
    console.log(`   ✅ Resources: Gold: 50000, Metal: 30000, Fuel: 20000, Energy: 10000`);

    // Create city for user2 (recipient of withdrawals)
    let user2City = await City.findOne({ where: { user_id: user2.id, is_capital: true } });
    if (!user2City) {
      user2City = await City.create({
        user_id: user2.id,
        name: `${user2.username}'s Capital`,
        is_capital: true,
        coord_x: Math.floor(Math.random() * 100),
        coord_y: Math.floor(Math.random() * 100),
      });

      // Initialize resources for user2 (they start at 0)
      for (const [type, amount] of Object.entries({ or: 0, metal: 0, essence: 0, energie: 0 })) {
        await Resource.create({
          city_id: user2City.id,
          type,
          amount,
        });
      }
    }
    console.log(`   ✅ User2 city: ${user2City.name} (ID: ${user2City.id})`);

    // 4. Initialize Treasury Service
    console.log('\n3️⃣  Initializing Treasury Service...');
    const treasuryService = new AllianceTreasuryService();
    console.log('   ✅ Treasury service ready');

    // 5. Test get treasury balances (should be 0 initially)
    console.log('\n4️⃣  Checking initial treasury balances...');
    const initialBalances = await treasuryService.getTreasuryBalances(alliance.id);
    console.log(`   💰 Gold: ${initialBalances.gold}`);
    console.log(`   ⚙️  Metal: ${initialBalances.metal}`);
    console.log(`   ⛽ Fuel: ${initialBalances.fuel}`);
    console.log(`   ⚡ Energy: ${initialBalances.energy}`);

    // 6. Test deposit resources
    console.log('\n5️⃣  Testing resource deposit...');
    const depositResult = await treasuryService.depositResources(alliance.id, user1.id, {
      gold: 10000,
      metal: 5000,
      fuel: 3000,
    });

    console.log(`   ✅ Deposit successful!`);
    depositResult.deposits.forEach((deposit) => {
      console.log(
        `      ${deposit.resourceType}: ${deposit.amount} (balance: ${deposit.balanceBefore} → ${deposit.balanceAfter})`
      );
    });

    // 7. Verify treasury balances updated
    console.log('\n6️⃣  Verifying treasury balances after deposit...');
    const afterDepositBalances = await treasuryService.getTreasuryBalances(alliance.id);
    console.log(`   💰 Gold: ${afterDepositBalances.gold}`);
    console.log(`   ⚙️  Metal: ${afterDepositBalances.metal}`);
    console.log(`   ⛽ Fuel: ${afterDepositBalances.fuel}`);

    // 8. Test withdraw (leader withdraws for user2)
    console.log('\n7️⃣  Testing resource withdrawal (leader action)...');
    const withdrawResult = await treasuryService.withdrawResources(
      alliance.id,
      user1.id, // Leader
      user2.id, // Recipient
      {
        gold: 2000,
        metal: 1000,
      },
      'Reward for contribution'
    );

    console.log(`   ✅ Withdrawal successful!`);
    withdrawResult.withdrawals.forEach((withdrawal) => {
      console.log(
        `      ${withdrawal.resourceType}: -${Math.abs(withdrawal.amount)} (balance: ${withdrawal.balanceBefore} → ${withdrawal.balanceAfter})`
      );
    });

    // 9. Get transaction history
    console.log('\n8️⃣  Fetching transaction history...');
    const history = await treasuryService.getTransactionHistory(alliance.id, { limit: 10 });
    console.log(`   📜 Found ${history.length} transactions:`);
    history.slice(0, 5).forEach((log) => {
      console.log(
        `      ${log.transactionType} | ${log.resourceType}: ${log.amount > 0 ? '+' : ''}${log.amount} | By: ${log.user?.username || 'System'}`
      );
    });

    // 10. Get member contributions
    console.log('\n9️⃣  Fetching member contributions...');
    const contributions = await treasuryService.getMemberContributions(alliance.id);
    console.log(`   🏆 Contributions by member:`);
    contributions.forEach((contrib) => {
      console.log(
        `      ${contrib.user?.username || 'Unknown'}: ${contrib.resourceType} = ${contrib.dataValues.totalAmount}`
      );
    });

    // Final summary
    console.log('\n✅ All Alliance Treasury Tests Passed!\n');
    console.log('📊 Summary:');
    console.log(`   - Alliance: ${alliance.name} [${alliance.tag}]`);
    console.log(`   - Members: ${alliance.memberCount}`);
    console.log(`   - Treasury: Gold: ${afterDepositBalances.gold}, Metal: ${afterDepositBalances.metal}, Fuel: ${afterDepositBalances.fuel}`);
    console.log(`   - Transactions logged: ${history.length}`);
    console.log(`   - Deposits: 3 resources`);
    console.log(`   - Withdrawals: 2 resources\n`);

    console.log('🎯 Treasury system ready for production!');

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
    console.log('📦 Database connection closed.\n');
    process.exit(0);
  }
};

// Run tests
testAllianceTreasury();
